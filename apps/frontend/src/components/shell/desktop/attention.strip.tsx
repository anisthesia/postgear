'use client';

import { FC, useMemo } from 'react';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useInbox } from '@gitroom/frontend/components/inbox/use.inbox';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const AttentionStrip: FC = () => {
  const { posts, postDates } = useCalendar();
  const t = useT();
  const toReview = useInbox().data?.counts.approvals || 0;

  const { failed, today } = useMemo(() => {
    const now = newDayjs();
    return {
      failed: posts.filter((p) => p.state === 'ERROR').length,
      today: posts.filter(
        (p) =>
          p.state === 'QUEUE' &&
          postDates.get(p)?.isSame(now, 'day') &&
          !postDates.get(p)?.isBefore(now)
      ).length,
    };
  }, [posts, postDates]);

  if (!failed && !today && !toReview) {
    return null;
  }

  return (
    <div className="flex items-center gap-[8px] px-[16px] py-[8px] bg-newBgColorInner text-[13px]">
      {failed > 0 && (
        <span className="px-[10px] py-[4px] rounded-full bg-red-500/15 text-red-500 font-[600]">
          {failed} {t('failed', 'failed')}
        </span>
      )}
      {toReview > 0 && (
        <span className="px-[10px] py-[4px] rounded-full bg-amber-500/15 text-amber-600 font-[600]">
          {toReview} {t('to_review', 'to review')}
        </span>
      )}
      {today > 0 && (
        <span className="px-[10px] py-[4px] rounded-full bg-boxFocused text-newTableTextFocused font-[600]">
          {today} {t('publishing_today', 'publishing today')}
        </span>
      )}
    </div>
  );
};
