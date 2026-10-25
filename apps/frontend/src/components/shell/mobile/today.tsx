'use client';

import { FC, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import {
  CalendarContext,
  CalendarWeekProvider,
  useCalendar,
} from '@gitroom/frontend/components/launches/calendar.context';
import { usePostActions } from '@gitroom/frontend/components/launches/calendar';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { DNDProvider } from '@gitroom/frontend/components/launches/helpers/dnd.provider';
import { QuickPostSheet } from '@gitroom/frontend/components/compose/quick.post.sheet';
import { fromUtc, newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { expandPosts } from '@gitroom/helpers/utils/posts.list.minify';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { AgendaItem } from '@gitroom/frontend/components/shell/mobile/agenda.item';
import { AttentionCards } from '@gitroom/frontend/components/shell/mobile/attention.cards';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const TodayContent: FC = () => {
  const t = useT();
  const { posts, postDates, loading } = useCalendar();
  const { editPost } = usePostActions();

  const { failed, drafts, parts, tomorrow } = useMemo(() => {
    const now = newDayjs();
    const sorted = [...posts].sort(
      (a, b) => postDates.get(a)!.valueOf() - postDates.get(b)!.valueOf()
    );
    const on = (day: 'today' | 'tomorrow') =>
      sorted.filter((p) =>
        postDates.get(p)!.isSame(day === 'today' ? now : now.add(1, 'day'), 'day')
      );
    const today = on('today');
    const hour = (p: any) => postDates.get(p)!.hour();
    return {
      failed: posts.filter((p) => p.state === 'ERROR'),
      drafts: posts.filter((p) => p.state === 'DRAFT'),
      parts: [
        { key: 'morning', title: t('morning', 'Morning'), posts: today.filter((p) => hour(p) < 12) },
        { key: 'afternoon', title: t('afternoon', 'Afternoon'), posts: today.filter((p) => hour(p) >= 12 && hour(p) < 17) },
        { key: 'evening', title: t('evening', 'Evening'), posts: today.filter((p) => hour(p) >= 17) },
      ],
      tomorrow: on('tomorrow'),
    };
  }, [posts, postDates, t]);

  const sections = [
    ...parts,
    { key: 'tomorrow', title: t('tomorrow', 'Tomorrow'), posts: tomorrow },
  ].filter((s) => s.posts.length);

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="flex flex-col gap-[16px] p-[12px]">
      <QuickPostSheet />
      <AttentionCards
        failed={failed}
        drafts={drafts}
        dateOf={(p) => postDates.get(p)!}
        open={editPost}
      />
      {sections.length === 0 && (
        <div className="text-center text-textItemBlur text-[14px] py-[32px]">
          {t('nothing_scheduled_today', 'Nothing scheduled for today or tomorrow')}
        </div>
      )}
      {sections.map((s) => (
        <section key={s.key} className="flex flex-col gap-[6px]">
          <h2 className="text-[13px] font-[600] text-textItemBlur">{s.title}</h2>
          {s.posts.map((post) => (
            <AgendaItem
              key={post.id}
              post={post}
              date={postDates.get(post)!}
              onOpen={editPost(post)}
            />
          ))}
        </section>
      ))}
    </div>
  );
};

// Today and tomorrow, fetched here so the view never touches the saved
// calendar display or the URL the Queue uses
const useTodayPosts = (customer: string | null) => {
  const fetch = useFetch();
  const day = newDayjs().format('YYYY-MM-DD');
  const load = useCallback(async () => {
    const params = new URLSearchParams({
      display: 'week',
      customer: customer || '',
      startDate: newDayjs().startOf('day').utc().format(),
      endDate: newDayjs().add(1, 'day').endOf('day').utc().format(),
    }).toString();
    return expandPosts(await (await fetch(`/posts?${params}`)).json());
  }, [customer]);
  return useSWR(`today-posts-${day}-${customer || ''}`, load, {
    refreshInterval: 3600000,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });
};

const TodayData: FC = () => {
  const calendar = useCalendar();
  const { data, isLoading, mutate } = useTodayPosts(calendar.customer);
  const posts = useMemo(() => data?.posts || [], [data?.posts]);
  const value = useMemo(
    () => ({
      ...calendar,
      posts,
      postDates: new Map<object, dayjs.Dayjs>(
        posts.map((post: any) => [post, fromUtc(post.publishDate)])
      ),
      loading: isLoading,
      reloadCalendarView: () => {
        mutate();
      },
    }),
    [calendar, posts, isLoading, mutate]
  );
  return (
    <CalendarContext.Provider value={value}>
      <TodayContent />
    </CalendarContext.Provider>
  );
};

export const Today: FC = () => {
  const { data: integrations } = useIntegrationList();
  return (
    <DNDProvider>
      <CalendarWeekProvider integrations={integrations || []}>
        <TodayData />
      </CalendarWeekProvider>
    </DNDProvider>
  );
};
