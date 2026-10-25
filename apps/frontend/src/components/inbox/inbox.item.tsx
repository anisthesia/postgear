'use client';

import { FC, MouseEvent, ReactNode, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { usePostActions } from '@gitroom/frontend/components/launches/calendar';
import { ChannelChips } from '@gitroom/frontend/components/queue/channel.chips';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  InboxComment,
  InboxPost,
} from '@gitroom/frontend/components/inbox/use.inbox';

const excerptOf = (content: string, empty: string) =>
  stripHtmlValidation('none', content, false, true, false) || empty;

const Button: FC<{
  onClick: (e: MouseEvent) => void;
  tone?: 'danger';
  children: ReactNode;
}> = ({ onClick, tone, children }) => (
  <button
    onClick={onClick}
    className={clsx(
      'h-[24px] px-[8px] rounded-[6px] text-[12px] font-[600]',
      tone === 'danger' ? 'bg-red-500/15 text-red-500' : 'bg-btnSimple'
    )}
  >
    {children}
  </button>
);

const Row: FC<{
  chips?: InboxPost[];
  meta: string;
  excerpt: string;
  note?: string | null;
  actions: ReactNode;
  children?: ReactNode;
}> = ({ chips, meta, excerpt, note, actions, children }) => (
  <div className="flex flex-col gap-[6px] p-[8px] rounded-[8px] bg-newColColor">
    <div className="flex items-center justify-between gap-[6px]">
      {chips ? <ChannelChips posts={chips} /> : <span />}
      <span className="text-[12px] text-textItemBlur shrink-0">{meta}</span>
    </div>
    <div className="text-[13px] line-clamp-2 break-words">{excerpt}</div>
    {note && (
      <div className="text-[12px] text-textItemBlur break-words">{note}</div>
    )}
    <div className="flex flex-wrap gap-[6px]">{actions}</div>
    {children}
  </div>
);

export const PostItem: FC<{
  kind: 'failed' | 'approval' | 'changes' | 'waiting' | 'activity';
  post: InboxPost;
  reload: () => void;
}> = ({ kind, post, reload }) => {
  const t = useT();
  const fetch = useFetch();
  const router = useRouter();
  const toaster = useToaster();
  const { integrations } = useCalendar();
  const { editPost } = usePostActions(reload);

  // the channel needs the user to log in again
  const reconnectable = integrations.find(
    (i: any) =>
      i.id === post.integration.id &&
      (i.inBetweenSteps || (i.refreshNeeded && !i.isCustomFields))
  ) as any;

  // same call the calendar uses to republish a post
  const retry = useCallback(async () => {
    await fetch(`/posts/${post.id}/date`, {
      method: 'PUT',
      body: JSON.stringify({
        date: newDayjs().add(1, 'minute').utc().format('YYYY-MM-DDTHH:mm:ss'),
        action: 'schedule',
        republish: true,
      }),
    });
    toaster.show(t('post_rescheduled', 'Post sent to the queue'), 'success');
    reload();
  }, [post.id, fetch, toaster, t, reload]);

  // same flows the channel menu uses to reconnect a channel
  const reconnect = useCallback(async () => {
    if (reconnectable.inBetweenSteps) {
      router.push(
        `/launches?added=${reconnectable.identifier}&continue=${reconnectable.id}`
      );
      return;
    }
    const { url } = await (
      await fetch(
        `/integrations/social/${reconnectable.identifier}?refresh=${reconnectable.internalId}`
      )
    ).json();
    window.location.href = url;
  }, [reconnectable, router, fetch]);

  const copyPreview = useCallback(async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/p/${post.id}?share=true`
    );
    toaster.show(t('link_copied', 'Link copied'), 'success');
  }, [post.id, toaster, t]);

  const open = (
    <Button key="open" onClick={() => editPost(post)()}>
      {kind === 'changes' ? t('edit', 'Edit') : t('open', 'Open')}
    </Button>
  );

  const actions: Record<typeof kind, ReactNode> = {
    failed: (
      <>
        <Button tone="danger" onClick={retry}>
          {t('retry', 'Retry')}
        </Button>
        {reconnectable && (
          <Button onClick={reconnect}>{t('reconnect', 'Reconnect')}</Button>
        )}
      </>
    ),
    approval: open,
    changes: open,
    waiting: (
      <Button onClick={copyPreview}>
        {t('copy_preview_link', 'Copy preview link')}
      </Button>
    ),
    activity: open,
  };

  const date =
    kind === 'failed' || kind === 'activity'
      ? post.updatedAt
      : post.reviewRequestedAt || post.updatedAt;

  return (
    <Row
      chips={[post]}
      meta={newDayjs(date).format('D MMM HH:mm')}
      excerpt={excerptOf(post.content, t('no_content', 'no content'))}
      note={kind === 'changes' ? post.comment : post.error}
      actions={actions[kind]}
    />
  );
};

export const CommentItem: FC<{
  comment: InboxComment;
  reload: () => void;
}> = ({ comment, reload }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const send = useCallback(async () => {
    if (!reply.trim()) {
      return;
    }
    await fetch(`/posts/${comment.post.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: reply.trim(), parentId: comment.id }),
    });
    toaster.show(t('reply_sent', 'Reply sent'), 'success');
    setReply('');
    setReplying(false);
    reload();
  }, [reply, comment, fetch, toaster, t, reload]);

  return (
    <Row
      chips={[comment.post as unknown as InboxPost]}
      meta={newDayjs(comment.createdAt).format('D MMM HH:mm')}
      excerpt={comment.content}
      note={`${comment.user?.name || comment.displayName || ''} · ${excerptOf(
        comment.post.content,
        t('no_content', 'no content')
      )}`}
      actions={
        <Button onClick={() => setReplying(!replying)}>
          {t('reply', 'Reply')}
        </Button>
      }
    >
      {replying && (
        <div className="flex gap-[6px]">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="flex-1 min-w-0 h-[28px] px-[8px] rounded-[6px] bg-btnSimple text-[13px] outline-none"
            placeholder={t('write_a_reply', 'Write a reply')}
          />
          <Button onClick={send}>{t('send', 'Send')}</Button>
        </div>
      )}
    </Row>
  );
};
