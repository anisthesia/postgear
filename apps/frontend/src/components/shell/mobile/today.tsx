'use client';

import { FC, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarWeekProvider,
  useCalendar,
} from '@gitroom/frontend/components/launches/calendar.context';
import { usePostActions } from '@gitroom/frontend/components/launches/calendar';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { DNDProvider } from '@gitroom/frontend/components/launches/helpers/dnd.provider';
import { NewPost } from '@gitroom/frontend/components/launches/new.post';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { AgendaItem } from '@gitroom/frontend/components/shell/mobile/agenda.item';
import { AttentionCards } from '@gitroom/frontend/components/shell/mobile/attention.cards';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const TodayContent: FC = () => {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const newPost = useRef<HTMLDivElement>(null);
  const { posts, postDates, loading, endDate, customer, setFilters } =
    useCalendar();
  const { editPost } = usePostActions();

  // the default week range stops at Sunday, tomorrow is next week then
  useEffect(() => {
    const tomorrow = newDayjs().add(1, 'day');
    if (tomorrow.isAfter(newDayjs(endDate), 'day')) {
      setFilters({
        startDate: newDayjs().format('YYYY-MM-DD'),
        endDate: tomorrow.format('YYYY-MM-DD'),
        display: 'week',
        customer,
      });
    }
  }, []);

  // the New tab lands here with ?new=1 and opens the existing new post flow
  useEffect(() => {
    if (search.get('new') && !loading) {
      newPost.current?.querySelector('button')?.click();
      router.replace('/launches');
    }
  }, [search, loading]);

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
      <div ref={newPost} className="hidden">
        <NewPost />
      </div>
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

export const Today: FC = () => {
  const { data: integrations } = useIntegrationList();
  return (
    <DNDProvider>
      <CalendarWeekProvider integrations={integrations || []}>
        <TodayContent />
      </CalendarWeekProvider>
    </DNDProvider>
  );
};
