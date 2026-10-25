'use client';

import {
  FC,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { expandPostsList } from '@gitroom/helpers/utils/posts.list.minify';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { usePostActions } from '@gitroom/frontend/components/launches/calendar';
import { TimeTable } from '@gitroom/frontend/components/launches/time.table';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { fromUtc } from '@gitroom/frontend/components/layout/set.timezone';
import { getDateRange } from '@gitroom/frontend/components/shell/desktop/shortcuts';
import {
  buildItems,
  CalendarBridge,
  getCalendarBridge,
  matchRange,
  onOpenPalette,
  PaletteGroup,
  PaletteItem,
  registerCalendarBridge,
} from '@gitroom/frontend/components/shell/desktop/palette.items';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const MAX_PER_GROUP = 6;

const useDebounced = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
};

// The list endpoint has no text search, so the page is filtered by the query here
const usePaletteSearch = (query: string, customer?: string | null) => {
  const fetch = useFetch();
  const debounced = useDebounced(query.trim(), 150);
  const load = useCallback(async () => {
    const params = new URLSearchParams({
      page: '0',
      limit: '100',
      state: 'all',
      customer: customer || '',
    });
    const { posts } = expandPostsList(
      await (await fetch(`/posts/list?${params}`)).json()
    );
    const q = debounced.toLowerCase();
    const text = (post: any) =>
      stripHtmlValidation('none', post.content, false, true, false);
    return posts.filter(
      (post: any) =>
        text(post).toLowerCase().includes(q) ||
        post.integration?.name?.toLowerCase().includes(q)
    );
  }, [debounced, customer]);
  return useSWR(debounced ? `palette-search-${customer}-${debounced}` : null, load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
};

const useOrganizations = (enabled: boolean) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return await (await fetch('/user/organizations')).json();
  }, []);
  // same key as the organization selector, so the list is shared
  return useSWR(enabled ? 'organizations' : null, load, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });
};

// Rendered by the calendar page inside the calendar provider
export const PaletteBridge: FC = () => {
  const calendar = useCalendar();
  const { editPost } = usePostActions();
  const modal = useModals();
  const t = useT();

  useEffect(() => {
    const bridge: CalendarBridge = {
      customer: calendar.customer,
      integrations: calendar.integrations,
      setDisplay: (display) =>
        calendar.setFilters({
          ...getDateRange(display),
          display,
          customer: calendar.customer,
        }),
      today: () => {
        const display = calendar.display as any;
        calendar.setFilters({
          ...getDateRange(display),
          display,
          customer: calendar.customer,
        });
      },
      jumpTo: (date) => {
        const display = calendar.display === 'list' ? 'week' : (calendar.display as any);
        calendar.setFilters({
          ...getDateRange(display, date),
          display,
          customer: calendar.customer,
        });
      },
      setCustomer: (customer) =>
        calendar.setFilters({
          startDate: calendar.startDate,
          endDate: calendar.endDate,
          display: calendar.display as any,
          customer,
        }),
      newPost: () =>
        document
          .querySelector<HTMLElement>('[data-shell-new-post] button')
          ?.click(),
      openPost: (post) => editPost(post)(),
      editSlots: (id) =>
        modal.openModal({
          withCloseButton: true,
          closeOnEscape: false,
          closeOnClickOutside: false,
          askClose: true,
          title: t('time_table_slots', 'Time Table Slots'),
          children: (
            <TimeTable
              integration={calendar.integrations.find((i) => i.id === id)!}
              mutate={() => mutate('/integrations/list')}
            />
          ),
        }),
    };
    registerCalendarBridge(bridge);
    return () => registerCalendarBridge(null);
  }, [calendar, editPost, modal, t]);

  return null;
};

const Highlight: FC<{ label: string; query: string }> = ({ label, query }) => {
  const range = matchRange(label, query);
  if (!range) {
    return <>{label}</>;
  }
  return (
    <>
      {label.slice(0, range[0])}
      <mark className="bg-transparent text-newTableTextFocused font-[700]">
        {label.slice(range[0], range[1])}
      </mark>
      {label.slice(range[1])}
    </>
  );
};

const Kbd: FC<{ children: ReactNode }> = ({ children }) => (
  <kbd className="px-[5px] py-[1px] rounded-[4px] bg-btnSimple text-[11px] font-sans text-textItemBlur">
    {children}
  </kbd>
);

export const CommandPalette: FC = () => {
  const t = useT();
  const router = useRouter();
  const fetch = useFetch();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(
    () =>
      onOpenPalette(() => {
        opener.current = document.activeElement as HTMLElement;
        setQuery('');
        setActive(0);
        setOpen(true);
      }),
    []
  );

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.();
  }, []);

  const bridge = open ? getCalendarBridge() : null;
  const { data: organizations } = useOrganizations(open);
  const { data: found } = usePaletteSearch(open && bridge ? query : '', bridge?.customer);

  const changeOrg = useCallback(
    (id: string) => async () => {
      await fetch('/user/change-org', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      window.location.reload();
    },
    [fetch]
  );

  const items = useMemo(() => {
    if (!open) {
      return [];
    }
    const base = buildItems({
      t,
      go: (path) => () => router.push(path),
      openInbox: () =>
        document
          .querySelector<HTMLElement>('[data-shell-inbox] .cursor-pointer')
          ?.click(),
      query,
      organizations: organizations || [],
      currentOrg: user?.orgId,
      changeOrg,
    }).filter((item) => !query.trim() || matchRange(item.label, query));

    const seen = new Set<string>();
    const posts: PaletteItem[] = (found || [])
      .filter((post: any) => !seen.has(post.group) && !!seen.add(post.group))
      .map((post: any) => ({
        id: `post-${post.id}`,
        group: 'posts' as const,
        label:
          stripHtmlValidation('none', post.content, false, true, false).slice(0, 80) ||
          t('no_content', 'no content'),
        secondary: `${post.integration?.name} · ${fromUtc(post.publishDate).format('D MMM, LT')}`,
        run: () => getCalendarBridge()?.openPost(post),
      }));

    const order: PaletteGroup[] = ['actions', 'posts', 'goto'];
    return order.flatMap((group) =>
      [...(group === 'posts' ? posts : base)]
        .filter((item) => item.group === group)
        .slice(0, group === 'posts' ? 8 : MAX_PER_GROUP + 4)
    );
  }, [open, query, found, organizations, user?.orgId, t, router, changeOrg]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      input.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    document.getElementById(`palette-item-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = useCallback(
    (item?: PaletteItem) => {
      if (!item) return;
      setOpen(false);
      item.run();
    },
    []
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[active]);
    } else if (e.key === 'Tab') {
      // the input is the only focusable element, keep the focus in the dialog
      e.preventDefault();
    }
  };

  if (!open) {
    return null;
  }

  const titles: Record<PaletteGroup, string> = {
    actions: t('actions', 'Actions'),
    posts: t('posts', 'Posts'),
    goto: t('go_to', 'Go to'),
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[12vh] bg-newBackdrop/60"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('command_palette', 'Command palette')}
        className="w-[640px] max-w-[92vw] flex flex-col rounded-[12px] bg-newBgColorInner text-newTextColor border border-newTableBorder shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items.length ? `palette-item-${active}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('palette_placeholder', 'Type a command or search posts…')}
          className="h-[52px] px-[16px] bg-transparent outline-none text-[15px] border-b border-newTableBorder"
        />
        <div
          id="palette-list"
          role="listbox"
          className="max-h-[50vh] overflow-y-auto p-[6px]"
        >
          {items.length === 0 && (
            <div className="px-[10px] py-[16px] text-[13px] text-textItemBlur">
              {t('no_results', 'No results')}
            </div>
          )}
          {items.map((item, index) => (
            <div key={item.id} role="presentation">
              {(index === 0 || items[index - 1].group !== item.group) && (
                <div className="px-[10px] pt-[8px] pb-[4px] text-[11px] font-[600] uppercase text-textItemBlur">
                  {titles[item.group]}
                </div>
              )}
              <div
                id={`palette-item-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseMove={() => setActive(index)}
                onClick={() => run(item)}
                className={clsx(
                  'flex items-center gap-[10px] px-[10px] h-[36px] rounded-[8px] cursor-pointer text-[14px]',
                  index === active && 'bg-boxFocused text-textItemFocused'
                )}
              >
                <span className="flex-1 min-w-0 truncate">
                  <Highlight label={item.label} query={query} />
                </span>
                {item.secondary && (
                  <span className="text-[12px] text-textItemBlur truncate max-w-[40%]">
                    {item.secondary}
                  </span>
                )}
                {item.hint && <Kbd>{item.hint}</Kbd>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[14px] px-[14px] h-[36px] border-t border-newTableBorder text-[12px] text-textItemBlur">
          <span className="flex items-center gap-[4px]"><Kbd>↑</Kbd><Kbd>↓</Kbd> {t('navigate', 'Navigate')}</span>
          <span className="flex items-center gap-[4px]"><Kbd>↵</Kbd> {t('select', 'Select')}</span>
          <span className="flex items-center gap-[4px]"><Kbd>Esc</Kbd> {t('close', 'Close')}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
