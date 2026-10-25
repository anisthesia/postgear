'use client';

import { FC, useMemo } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import SafeImage from '@gitroom/react/helpers/safe.image';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import {
  ReviewPill,
  useReviewStatuses,
} from '@gitroom/frontend/components/inbox/review.actions';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const statusStyle: Record<string, string> = {
  QUEUE: 'bg-boxFocused text-newTableTextFocused',
  PUBLISHED: 'bg-green-500/15 text-green-500',
  ERROR: 'bg-red-500/15 text-red-500',
  DRAFT: 'bg-btnSimple text-textItemBlur',
};

export const AgendaItem: FC<{
  post: any;
  date: dayjs.Dayjs;
  onOpen: () => void;
}> = ({ post, date, onOpen }) => {
  const t = useT();
  const reviewStatus = useReviewStatuses().get(post.group);
  const labels: Record<string, string> = useMemo(
    () => ({
      QUEUE: t('scheduled', 'Scheduled'),
      PUBLISHED: t('published', 'Published'),
      ERROR: t('failed', 'Failed'),
      DRAFT: t('draft', 'Draft'),
    }),
    [t]
  );
  const excerpt = stripHtmlValidation(
    'none',
    post.content,
    false,
    true,
    false
  );

  return (
    <button
      onClick={onOpen}
      className="w-full min-h-[64px] flex items-center gap-[12px] px-[12px] py-[10px] rounded-[10px] bg-newBgColorInner text-start"
    >
      <SafeImage
        src={post.integration?.picture}
        alt={post.integration?.name}
        width={32}
        height={32}
        className="w-[32px] h-[32px] rounded-full shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[8px] text-[12px] text-textItemBlur">
          <span>{date.format('LT')}</span>
          <span className="truncate">{post.integration?.name}</span>
        </div>
        <div className="text-[14px] truncate">{excerpt}</div>
      </div>
      <div className="flex flex-col items-end gap-[4px] shrink-0">
        <ReviewPill status={reviewStatus} />
        <span
          className={clsx(
            'px-[8px] py-[2px] rounded-full text-[11px] font-[600]',
            statusStyle[post.state]
          )}
        >
          {labels[post.state]}
        </span>
      </div>
    </button>
  );
};
