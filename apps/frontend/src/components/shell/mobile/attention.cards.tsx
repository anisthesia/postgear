'use client';

import { FC } from 'react';
import dayjs from 'dayjs';
import { AgendaItem } from '@gitroom/frontend/components/shell/mobile/agenda.item';
import { useInbox } from '@gitroom/frontend/components/inbox/use.inbox';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const AttentionCards: FC<{
  failed: any[];
  drafts: any[];
  dateOf: (post: any) => dayjs.Dayjs;
  open: (post: any) => () => void;
}> = ({ failed, drafts, dateOf, open }) => {
  const t = useT();
  const approvals = useInbox().data?.approvals || [];
  const groups = [
    { key: 'failed', title: t('failed', 'Failed'), posts: failed, tone: 'text-red-500' },
    { key: 'review', title: t('to_review', 'To review'), posts: approvals, tone: 'text-amber-600' },
    { key: 'drafts', title: t('drafts', 'Drafts'), posts: drafts, tone: 'text-textItemBlur' },
  ].filter((g) => g.posts.length);

  if (!groups.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[12px]">
      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-[6px]">
          <h2 className={`text-[13px] font-[600] ${g.tone}`}>
            {g.posts.length} {g.title}
          </h2>
          {g.posts.map((post) => (
            <AgendaItem
              key={post.id}
              post={post}
              date={
                g.key === 'review'
                  ? newDayjs(post.reviewRequestedAt || post.updatedAt)
                  : dateOf(post)
              }
              onOpen={open(post)}
            />
          ))}
        </section>
      ))}
    </div>
  );
};
