'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import dayjs from 'dayjs';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { countLength } from '@gitroom/helpers/utils/count.length';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';

export type ComposeMedia = { id: string; path: string };
export type ComposeTag = { value: string; label: string };
export type ComposeSaveType = 'draft' | 'schedule' | 'now';
export type ComposeWhen =
  | { kind: 'slot' }
  | { kind: 'tonight' }
  | { kind: 'date'; date: string };

const DEFAULT_CHANNELS_KEY = 'compose-default-channels';

const readDefaultChannels = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DEFAULT_CHANNELS_KEY) || '[]');
  } catch (err) {
    return [];
  }
};

type ComposeState = {
  open: boolean;
  text: string;
  media: ComposeMedia[];
  channels: string[];
  when: ComposeWhen;
  setOpen: (open: boolean) => void;
  setText: (text: string) => void;
  setMedia: (media: ComposeMedia[]) => void;
  setChannels: (channels: string[]) => void;
  setWhen: (when: ComposeWhen) => void;
  reset: () => void;
};

export const useComposeStore = create<ComposeState>((set) => ({
  open: false,
  text: '',
  media: [],
  channels: [],
  when: { kind: 'slot' },
  setOpen: (open) => set({ open }),
  setText: (text) => set({ text }),
  setMedia: (media) => set({ media }),
  setChannels: (channels) => set({ channels }),
  setWhen: (when) => set({ when }),
  reset: () =>
    set({ text: '', media: [], when: { kind: 'slot' }, open: false }),
}));

export const openCompose = () => useComposeStore.getState().setOpen(true);

// the editor stores html, the panel writes plain text
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const textToHtml = (text: string) =>
  text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

export const useCompose = (
  integrations: (Integrations & { refreshNeeded?: boolean })[],
  onSaved?: () => void,
  tags: ComposeTag[] = []
) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const state = useComposeStore();
  const { text, media, channels, when } = state;
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [issues, setIssues] = useState<Record<string, string>>({});

  const available = integrations.filter(
    (i) => !i.disabled && !i.refreshNeeded
  );

  // the saved default set, kept to the channels that still exist
  useEffect(() => {
    if (!available.length || channels.length) {
      return;
    }
    const defaults = readDefaultChannels().filter((id) =>
      available.some((i) => i.id === id)
    );
    if (defaults.length) {
      state.setChannels(defaults);
    }
  }, [integrations]);

  const selected = available.filter((i) => channels.includes(i.id));
  const channelKey = channels.join(',');

  const toggleChannel = (id: string) => {
    state.setChannels(
      channels.includes(id)
        ? channels.filter((c) => c !== id)
        : [...channels, id]
    );
  };

  const saveDefaultChannels = () => {
    localStorage.setItem(DEFAULT_CHANNELS_KEY, JSON.stringify(channels));
    toaster.show(t('compose_default_saved', 'Default channels saved'));
  };

  const buildPosts = () => {
    const group = makeId(10);
    return selected.map((integration) => ({
      integration: { id: integration.id },
      group,
      settings: {},
      value: [
        {
          content: textToHtml(text),
          delay: 0,
          image: media.map(({ id, path }) => ({ id, path })),
        },
      ],
    }));
  };

  const resolveDate = async (): Promise<dayjs.Dayjs> => {
    if (when.kind === 'date') {
      return newDayjs(when.date);
    }
    if (when.kind === 'tonight') {
      const tonight = newDayjs().hour(20).minute(0).second(0);
      return tonight.isBefore(newDayjs()) ? tonight.add(1, 'day') : tonight;
    }
    const { date } = await (await fetch('/posts/find-slot')).json();
    return dayjs.utc(date);
  };

  // the first blocking problem the server reports for a channel, same checks the editor runs
  const issueOf = (item: any): string | undefined => {
    if (item.emptyContent) {
      return t(
        'post_needs_content_or_image',
        'Your post should have at least one character or one image.'
      );
    }
    if (item.valid === false) {
      return (
        item.settingsError ||
        t(
          'compose_needs_settings',
          'This channel needs extra settings, open the full editor'
        )
      );
    }
    if (item.errors !== true) {
      return item.errors;
    }
    if (item.tooLong) {
      return t('post_is_too_long', 'post is too long, please fix it');
    }
    return undefined;
  };

  // the server knows each provider's limit, the same call the editor makes before saving
  useEffect(() => {
    if (!selected.length) {
      return;
    }
    const handle = setTimeout(async () => {
      const response = await fetch('/posts/valid', {
        method: 'POST',
        body: JSON.stringify({
          type: 'draft',
          posts: buildPosts().map((p) => ({ ...p, group: 'compose' })),
        }),
      });
      if (!response.ok) {
        return;
      }
      const result: { id: string; maximumCharacters: number }[] =
        await response.json();
      setLimits(
        Object.fromEntries(result.map((r) => [r.id, r.maximumCharacters]))
      );
      // an untouched panel is not an error yet
      setIssues(
        hasDraft({ text, media })
          ? Object.fromEntries(
              result.flatMap((r: any) => {
                const issue = issueOf(r);
                return issue ? [[r.id, `${r.name}: ${issue}`]] : [];
              })
            )
          : {}
      );
    }, 500);
    return () => clearTimeout(handle);
  }, [channelKey, integrations, text, media]);

  const stripped = stripHtmlValidation('normal', textToHtml(text), true);
  const counts = Object.fromEntries(
    selected.map((i) => [
      i.id,
      { used: countLength(i.identifier, stripped), max: limits[i.id] },
    ])
  );

  const submit = async (
    type: ComposeSaveType,
    review?: 'TEAM' | 'CLIENT'
  ) => {
    if (!selected.length) {
      toaster.show(
        t('compose_pick_channel', 'Pick at least one channel'),
        'warning'
      );
      return false;
    }
    setLoading(true);
    const date = await resolveDate();
    const posts = buildPosts();

    const failed = (message?: string) => {
      toaster.show(
        message || t('post_save_failed', 'Could not save the post'),
        'warning'
      );
      setLoading(false);
      return false;
    };

    if (type !== 'draft') {
      const validResponse = await fetch('/posts/valid', {
        method: 'POST',
        body: JSON.stringify({ type, posts }),
      });
      if (!validResponse.ok) {
        return failed();
      }
      for (const item of await validResponse.json()) {
        const issue = issueOf(item);
        if (issue) {
          return failed(`${item.name}: ${issue}`);
        }
      }
    }

    const response = await fetch('/posts', {
      method: 'POST',
      body: JSON.stringify({
        type,
        tags,
        shortLink: false,
        date: date.utc().format('YYYY-MM-DDTHH:mm:ss'),
        posts,
      }),
    });
    if (!response.ok) {
      const { message } = await response.json().catch(() => ({}));
      return failed(typeof message === 'string' ? message : undefined);
    }

    // saved as a draft first, the review request needs the saved group
    if (review) {
      const reviewResponse = await fetch(`/posts/${posts[0].group}/review/request`, {
        method: 'POST',
        body: JSON.stringify({ target: review }),
      });
      if (!reviewResponse.ok) {
        toaster.show(
          t('review_failed', 'Could not update the review'),
          'warning'
        );
      }
    }

    toaster.show(t('added_successfully', 'Added successfully'));
    setLoading(false);
    state.reset();
    onSaved?.();
    return true;
  };

  return {
    ...state,
    loading,
    available,
    selected,
    counts,
    issues: Object.fromEntries(
      Object.entries(issues).filter(([id]) => channels.includes(id))
    ),
    toggleChannel,
    saveDefaultChannels,
    resolveDate,
    submit,
    // the full editor takes the same set shape a saved set has
    draftAsSet: (channelIds: string[]) => ({
      posts: channelIds.map((id) => ({
        integration: { id },
        settings: {},
        value: [
          {
            content: textToHtml(text),
            image: media.map(({ id, path }) => ({ id, path })),
          },
        ],
      })),
    }),
  };
};

export const hasDraft = (state: Pick<ComposeState, 'text' | 'media'>) =>
  !!state.text.trim() || state.media.length > 0;
