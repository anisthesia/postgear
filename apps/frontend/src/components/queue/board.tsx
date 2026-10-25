'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  useCalendar,
  useNow,
} from '@gitroom/frontend/components/launches/calendar.context';
import { usePostActions } from '@gitroom/frontend/components/launches/calendar';
import { AddEditModal } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { BoardColumn } from '@gitroom/frontend/components/queue/board.column';
import { QueueCard } from '@gitroom/frontend/components/queue/post.card';

const options = { preventDefault: true };

export const Board: FC = () => {
  const { startDate, posts, postDates, loading, integrations, reloadCalendarView } =
    useCalendar();
  const now = useNow();
  const modal = useModals();
  const { editPost } = usePostActions();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      [...new Array(7)].map((_, i) => {
        const day = newDayjs(startDate).add(i, 'day');
        const groups = new Map<string, QueueCard>();
        posts
          .filter((p) => postDates.get(p)?.isSame(day, 'day'))
          .sort((a, b) => postDates.get(a)!.valueOf() - postDates.get(b)!.valueOf())
          .forEach((post) => {
            const date = postDates.get(post)!;
            const key = `${post.group}-${date.valueOf()}`;
            const card = groups.get(key) || { key, date, posts: [] };
            card.posts.push(post);
            groups.set(key, card);
          });
        return { day, cards: [...groups.values()] };
      }),
    [startDate, posts, postDates]
  );

  const cards = useMemo(() => columns.flatMap((c) => c.cards), [columns]);

  const open = useCallback(
    (card: QueueCard, duplicate?: boolean) => () => {
      setSelectedKey(card.key);
      return editPost(card.posts[0], duplicate)();
    },
    [editPost]
  );

  // opens the editor on a free day, same modal the new post button opens
  const addAt = useCallback(
    (day: dayjs.Dayjs) => () => {
      const date = day.hour(9).minute(0).second(0);
      modal.openModal({
        id: 'add-edit-modal',
        closeOnClickOutside: false,
        removeLayout: true,
        closeOnEscape: false,
        withCloseButton: false,
        askClose: true,
        fullScreen: true,
        classNames: {
          modal: 'w-[100%] max-w-[1400px] text-textColor',
        },
        children: (
          <AddEditModal
            allIntegrations={integrations.map((p) => ({ ...p }))}
            reopenModal={addAt(day)}
            mutate={reloadCalendarView}
            integrations={integrations}
            date={date}
          />
        ),
        size: '80%',
        title: ``,
      });
    },
    [integrations, reloadCalendarView, modal]
  );

  const move = useCallback(
    (step: number) => () => {
      if (!cards.length) return;
      const index = cards.findIndex((c) => c.key === selectedKey);
      const next = index === -1 ? (step > 0 ? 0 : cards.length - 1) : index + step;
      setSelectedKey(cards[Math.min(Math.max(next, 0), cards.length - 1)].key);
    },
    [cards, selectedKey]
  );

  const selected = cards.find((c) => c.key === selectedKey);
  // Enter and D on a focused card button would also click it
  const act = (duplicate?: boolean) => () => {
    if (selected && document.activeElement?.tagName !== 'BUTTON') {
      open(selected, duplicate)();
    }
  };

  useHotkeys('j', move(1), options);
  useHotkeys('k', move(-1), options);
  useHotkeys('enter', act(), options);
  useHotkeys('d', act(true), options);

  // a narrow board scrolls sideways, keep today in view
  useEffect(() => {
    if (!loading) {
      document
        .querySelector('[data-board-today]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [loading, startDate]);

  useEffect(() => {
    if (selectedKey) {
      document
        .querySelector(`[data-card-key="${selectedKey}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedKey]);

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="flex-1 min-w-0 overflow-x-auto">
      <div className="grid grid-cols-[repeat(7,minmax(130px,1fr))] gap-[1px] bg-newBgLineColor min-h-full">
        {columns.map(({ day, cards }) => (
          <BoardColumn
            key={day.format('YYYY-MM-DD')}
            day={day}
            today={day.isSame(now, 'day')}
            future={day.isAfter(now, 'day')}
            cards={cards}
            now={now}
            selectedKey={selectedKey}
            open={(card) => open(card)}
            addAt={addAt}
          />
        ))}
      </div>
    </div>
  );
};
