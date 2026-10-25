'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface InboxIntegration {
  id: string;
  name: string;
  picture: string;
  providerIdentifier: string;
}

export interface InboxPost {
  id: string;
  group: string;
  content: string;
  publishDate: string;
  state: 'QUEUE' | 'PUBLISHED' | 'ERROR' | 'DRAFT';
  error: string | null;
  updatedAt: string;
  reviewStatus: 'REQUESTED' | 'CHANGES_REQUESTED' | 'APPROVED' | null;
  reviewTarget: 'TEAM' | 'CLIENT' | null;
  reviewRequestedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string | null } | null;
  integration: InboxIntegration;
  comment?: string | null;
}

export interface InboxComment {
  id: string;
  content: string;
  displayName: string | null;
  createdAt: string;
  user: { id: string; name: string | null } | null;
  post: {
    id: string;
    group: string;
    content: string;
    integration: InboxIntegration;
  };
}

export interface InboxData {
  failed: InboxPost[];
  approvals: InboxPost[];
  changesRequested: InboxPost[];
  waitingOnClient: InboxPost[];
  activity: InboxPost[];
  comments: InboxComment[];
  counts: {
    failed: number;
    approvals: number;
    changesRequested: number;
    waitingOnClient: number;
    comments: number;
  };
}

export const useInbox = (limit = 20) => {
  const fetch = useFetch();

  const load = useCallback(
    async (path: string) => (await fetch(path)).json() as Promise<InboxData>,
    [fetch]
  );

  return useSWR(`/posts/inbox?limit=${limit}`, load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    keepPreviousData: true,
  });
};
