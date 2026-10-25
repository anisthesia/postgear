'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useSWRConfig } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  InboxPost,
  useInbox,
} from '@gitroom/frontend/components/inbox/use.inbox';

type ReviewStatus = NonNullable<InboxPost['reviewStatus']>;

const pillStyle: Record<ReviewStatus, string> = {
  REQUESTED: 'bg-amber-500/15 text-amber-600',
  CHANGES_REQUESTED: 'bg-red-500/15 text-red-500',
  APPROVED: 'bg-green-500/15 text-green-600',
};

// the board and the agenda only know a post's group, the inbox knows its review status
export const useReviewStatuses = () => {
  const { data } = useInbox(50);
  return useMemo(() => {
    const map = new Map<string, ReviewStatus>();
    if (!data) {
      return map;
    }
    [
      ...data.activity,
      ...data.waitingOnClient,
      ...data.approvals,
      ...data.changesRequested,
    ].forEach((post) => {
      if (post.reviewStatus) {
        map.set(post.group, post.reviewStatus);
      }
    });
    return map;
  }, [data]);
};

export const ReviewPill: FC<{ status?: ReviewStatus | null }> = ({
  status,
}) => {
  const t = useT();
  if (!status) {
    return null;
  }
  const labels: Record<ReviewStatus, string> = {
    REQUESTED: t('awaiting_review', 'Awaiting review'),
    CHANGES_REQUESTED: t('changes_requested', 'Changes requested'),
    APPROVED: t('approved', 'Approved'),
  };
  return (
    <span
      className={clsx(
        'px-[6px] py-[1px] rounded-full text-[11px] font-[600] shrink-0',
        pillStyle[status]
      )}
    >
      {labels[status]}
    </span>
  );
};

// revalidates every inbox key so the inbox, the board and the agenda agree
export const useReviewCalls = (after?: () => void) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const { mutate } = useSWRConfig();

  const call = useCallback(
    async (group: string, action: string, body?: object) => {
      const response = await fetch(`/posts/${group}/review/${action}`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      });
      if (!response.ok) {
        toaster.show(
          t('review_failed', 'Could not update the review'),
          'warning'
        );
        return false;
      }
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/posts/inbox')
      );
      after?.();
      return true;
    },
    [fetch, toaster, t, mutate, after]
  );

  return {
    approve: (group: string) => call(group, 'approve'),
    requestChanges: (group: string, comment: string) =>
      call(group, 'request-changes', { comment }),
  };
};

export const ReviewActions: FC<{ group: string; reload: () => void }> = ({
  group,
  reload,
}) => {
  const t = useT();
  const { approve, requestChanges } = useReviewCalls(reload);
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');

  const send = async () => {
    if (!comment.trim()) {
      return;
    }
    if (await requestChanges(group, comment.trim())) {
      setComment('');
      setCommenting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[6px] w-full">
      <div className="flex gap-[6px]">
        <button
          onClick={() => approve(group)}
          className="h-[24px] px-[8px] rounded-[6px] text-[12px] font-[600] bg-green-500/15 text-green-600"
        >
          {t('approve', 'Approve')}
        </button>
        <button
          onClick={() => setCommenting(!commenting)}
          className="h-[24px] px-[8px] rounded-[6px] text-[12px] font-[600] bg-btnSimple"
        >
          {t('request_changes', 'Request changes')}
        </button>
      </div>
      {commenting && (
        <div className="flex gap-[6px]">
          <input
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="flex-1 min-w-0 h-[28px] px-[8px] rounded-[6px] bg-btnSimple text-[13px] outline-none"
            placeholder={t('what_needs_to_change', 'What needs to change?')}
          />
          <button
            disabled={!comment.trim()}
            onClick={send}
            className="h-[24px] px-[8px] rounded-[6px] text-[12px] font-[600] bg-btnSimple disabled:opacity-50"
          >
            {t('send', 'Send')}
          </button>
        </div>
      )}
    </div>
  );
};
