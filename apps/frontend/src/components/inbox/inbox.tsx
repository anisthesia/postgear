'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { CalendarWeekProvider } from '@gitroom/frontend/components/launches/calendar.context';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { DNDProvider } from '@gitroom/frontend/components/launches/helpers/dnd.provider';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import {
  CommentItem,
  PostItem,
} from '@gitroom/frontend/components/inbox/inbox.item';
import { useInbox } from '@gitroom/frontend/components/inbox/use.inbox';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type Tab = 'needs' | 'activity' | 'comments';

const PAGE = 20;

const InboxContent: FC = () => {
  const t = useT();
  const [tab, setTab] = useState<Tab>('needs');
  const [limit, setLimit] = useState(PAGE);
  const { data, mutate } = useInbox(limit);
  const reload = useCallback(() => mutate(), [mutate]);

  if (!data) {
    return <LoadingComponent />;
  }

  const { counts } = data;
  const needsCount = counts.failed + counts.approvals + counts.changesRequested;
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'needs', label: t('needs_me', 'Needs me'), count: needsCount },
    { key: 'activity', label: t('activity', 'Activity'), count: 0 },
    { key: 'comments', label: t('comments', 'Comments'), count: counts.comments },
  ];

  const sections = [
    { key: 'failed', count: counts.failed, title: t('failed', 'Failed'), kind: 'failed', posts: data.failed },
    { key: 'approvals', count: counts.approvals, title: t('to_review', 'To review'), kind: 'approval', posts: data.approvals },
    { key: 'changes', count: counts.changesRequested, title: t('changes_requested', 'Changes requested'), kind: 'changes', posts: data.changesRequested },
    { key: 'waiting', count: counts.waitingOnClient, title: t('waiting_on_client', 'Waiting on client'), kind: 'waiting', posts: data.waitingOnClient },
  ] as const;

  const hasMore =
    (tab === 'needs' &&
      (data.failed.length < counts.failed ||
        data.approvals.length < counts.approvals ||
        data.changesRequested.length < counts.changesRequested ||
        data.waitingOnClient.length < counts.waitingOnClient)) ||
    (tab === 'comments' && data.comments.length < counts.comments) ||
    (tab === 'activity' && data.activity.length >= limit);

  const empty =
    (tab === 'needs' && sections.every((s) => !s.posts.length)) ||
    (tab === 'activity' && !data.activity.length) ||
    (tab === 'comments' && !data.comments.length);

  return (
    <div className="flex flex-col gap-[12px] p-[12px] w-full max-w-[720px] mx-auto">
      <div className="flex gap-[4px]">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              'h-[32px] px-[12px] rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]',
              tab === item.key
                ? 'bg-boxFocused text-textItemFocused'
                : 'text-textItemBlur'
            )}
          >
            {item.label}
            {item.count > 0 && (
              <span className="text-[11px] px-[6px] rounded-full bg-btnSimple">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {empty && (
        <div className="text-center text-textItemBlur text-[14px] py-[32px]">
          {t('inbox_empty', 'Nothing here')}
        </div>
      )}
      {tab === 'needs' &&
        sections
          .filter((s) => s.posts.length)
          .map((s) => (
            <section key={s.key} className="flex flex-col gap-[6px]">
              <h2 className="text-[13px] font-[600] text-textItemBlur">
                {s.count}{' '}
                {s.title}
              </h2>
              {s.posts.map((post) => (
                <PostItem key={post.id} kind={s.kind} post={post} reload={reload} />
              ))}
            </section>
          ))}
      {tab === 'activity' &&
        data.activity.map((post) => (
          <PostItem key={post.id} kind="activity" post={post} reload={reload} />
        ))}
      {tab === 'comments' &&
        data.comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} reload={reload} />
        ))}
      {hasMore && (
        <button
          onClick={() => setLimit(limit + PAGE)}
          className="h-[32px] rounded-[8px] bg-btnSimple text-[13px] font-[600]"
        >
          {t('load_more', 'Load more')}
        </button>
      )}
    </div>
  );
};

// the calendar provider gives the item actions the same integrations and editor the board uses
export const Inbox: FC = () => {
  const { data: integrations } = useIntegrationList();
  return (
    <DNDProvider>
      <CalendarWeekProvider integrations={integrations || []}>
        <InboxContent />
      </CalendarWeekProvider>
    </DNDProvider>
  );
};
