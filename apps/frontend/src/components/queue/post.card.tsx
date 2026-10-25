'use client';

import { FC, MouseEvent, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { ChannelChips } from '@gitroom/frontend/components/queue/channel.chips';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { isUSCitizen } from '@gitroom/frontend/components/launches/helpers/isuscitizen.utils';

export type QueueStatus =
  | 'published'
  | 'scheduled'
  | 'publishing'
  | 'failed'
  | 'draft';

// one card per post group, the posts of a group are the same post on several channels
export interface QueueCard {
  key: string;
  date: dayjs.Dayjs;
  posts: any[];
}

const statusStyle: Record<QueueStatus, string> = {
  published: 'bg-green-500/15 text-green-600',
  scheduled: 'bg-boxFocused text-newTableTextFocused',
  publishing: 'bg-amber-500/15 text-amber-600',
  failed: 'bg-red-500/15 text-red-500',
  draft: 'bg-btnSimple text-textItemBlur',
};

const postStatus = (post: any, date: dayjs.Dayjs, now: dayjs.Dayjs) => {
  if (post.state === 'ERROR') return 'failed';
  if (post.state === 'DRAFT') return 'draft';
  if (post.state === 'PUBLISHED') return 'published';
  return date.isAfter(now) ? 'scheduled' : 'publishing';
};

const order: QueueStatus[] = [
  'failed',
  'publishing',
  'scheduled',
  'draft',
  'published',
];

export const cardStatus = (card: QueueCard, now: dayjs.Dayjs): QueueStatus => {
  const statuses = card.posts.map((p) => postStatus(p, card.date, now));
  return order.find((s) => statuses.includes(s))!;
};

export const PostCard: FC<{
  card: QueueCard;
  now: dayjs.Dayjs;
  selected: boolean;
  open: () => void;
}> = ({ card, now, selected, open }) => {
  const t = useT();
  const fetch = useFetch();
  const router = useRouter();
  const toaster = useToaster();
  const { integrations, reloadCalendarView } = useCalendar();
  const status = cardStatus(card, now);

  const labels: Record<QueueStatus, string> = {
    published: t('published', 'Published'),
    scheduled: t('scheduled', 'Scheduled'),
    publishing: t('publishing', 'Publishing'),
    failed: t('failed', 'Failed'),
    draft: t('draft', 'Draft'),
  };

  const excerpt =
    stripHtmlValidation('none', card.posts[0].content, false, true, false) ||
    t('no_content', 'no content');

  // the channels of the failed posts that need the user to log in again
  const reconnectable = useMemo(
    () =>
      card.posts
        .filter((p) => p.state === 'ERROR')
        .map((p) =>
          integrations.find((i: any) => i.id === p.integration?.id)
        )
        .find(
          (i: any) =>
            i && (i.inBetweenSteps || (i.refreshNeeded && !i.isCustomFields))
        ) as any,
    [card.posts, integrations]
  );

  // same call the calendar uses to republish a post
  const retry = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      await Promise.all(
        card.posts
          .filter((p) => p.state === 'ERROR')
          .map((p) =>
            fetch(`/posts/${p.id}/date`, {
              method: 'PUT',
              body: JSON.stringify({
                date: newDayjs()
                  .add(1, 'minute')
                  .utc()
                  .format('YYYY-MM-DDTHH:mm:ss'),
                action: 'schedule',
                republish: true,
              }),
            })
          )
      );
      toaster.show(t('post_rescheduled', 'Post sent to the queue'), 'success');
      reloadCalendarView();
    },
    [card.posts, fetch, toaster, t, reloadCalendarView]
  );

  // same flows the channel menu uses to reconnect a channel
  const reconnect = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
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
    },
    [reconnectable, router, fetch]
  );

  return (
    <div
      data-card-key={card.key}
      onClick={open}
      className={clsx(
        'flex flex-col gap-[6px] p-[8px] rounded-[8px] bg-newColColor cursor-pointer text-start outline outline-2',
        selected ? 'outline-btnPrimary' : 'outline-transparent'
      )}
    >
      <div className="flex items-center justify-between gap-[6px]">
        <span className="text-[12px] text-textItemBlur">
          {card.date.format(isUSCitizen() ? 'hh:mm A' : 'HH:mm')}
        </span>
        <span
          className={clsx(
            'px-[6px] py-[1px] rounded-full text-[11px] font-[600]',
            statusStyle[status]
          )}
        >
          {labels[status]}
        </span>
      </div>
      <ChannelChips posts={card.posts} />
      <div className="text-[13px] line-clamp-2 break-words">{excerpt}</div>
      {status === 'failed' && (
        <div className="flex gap-[6px]">
          <button
            onClick={retry}
            className="h-[24px] px-[8px] rounded-[6px] bg-red-500/15 text-red-500 text-[12px] font-[600]"
          >
            {t('retry', 'Retry')}
          </button>
          {reconnectable && (
            <button
              onClick={reconnect}
              className="h-[24px] px-[8px] rounded-[6px] bg-btnSimple text-[12px] font-[600]"
            >
              {t('reconnect', 'Reconnect')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
