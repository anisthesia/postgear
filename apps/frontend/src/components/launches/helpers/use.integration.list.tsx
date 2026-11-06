'use client';

import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useCallback } from 'react';
import useSWR from 'swr';

export const useIntegrationList = () => {
  const fetch = useFetch();

  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()).integrations;
  }, []);

  return useSWR('/integrations/list', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    fallbackData: [],
  });
};
// provider display names by identifier, e.g. instagram-standalone -> Instagram (Standalone)
export const useProviderNames = () => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    const { social } = await (await fetch('/integrations')).json();
    return Object.fromEntries(
      (social || []).map((p: { identifier: string; name: string }) => [
        p.identifier,
        p.name.replace(/\n/g, ' '),
      ])
    ) as Record<string, string>;
  }, [fetch]);

  return useSWR('provider-names', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    fallbackData: {},
  });
};
