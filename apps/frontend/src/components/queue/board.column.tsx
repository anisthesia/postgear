'use client';

import { FC } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useDrop } from 'react-dnd';
import {
  canMoveTo,
  PostCard,
  QueueCard,
} from '@gitroom/frontend/components/queue/post.card';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const BoardColumn: FC<{
  day: dayjs.Dayjs;
  today: boolean;
  future: boolean;
  cards: QueueCard[];
  now: dayjs.Dayjs;
  selectedKey: string | null;
  open: (card: QueueCard) => () => void;
  addAt: (date: dayjs.Dayjs) => () => void;
  reschedule: (card: QueueCard, day: dayjs.Dayjs) => void;
}> = ({
  day,
  today,
  future,
  cards,
  now,
  selectedKey,
  open,
  addAt,
  reschedule,
}) => {
  const t = useT();
  const [{ over }, drop] = useDrop(
    () => ({
      accept: 'queue-card',
      canDrop: (card: QueueCard) => canMoveTo(card, day, now),
      drop: (card: QueueCard) => reschedule(card, day),
      collect: (monitor) => ({
        over: monitor.isOver() && monitor.canDrop(),
      }),
    }),
    [day, now, reschedule]
  );
  return (
    <div
      // @ts-ignore
      ref={drop}
      {...(today && { 'data-board-today': '' })}
      className={clsx(
        'flex flex-col gap-[6px] min-w-0 p-[8px] bg-newBgColorInner outline outline-2 -outline-offset-2',
        today && 'bg-boxFocused',
        over ? 'outline-btnPrimary' : 'outline-transparent'
      )}
    >
      <div
        className={clsx(
          'flex items-baseline gap-[6px] text-[13px] font-[600]',
          today ? 'text-newTableTextFocused' : 'text-textItemBlur'
        )}
      >
        <span>{day.format('ddd')}</span>
        <span className="text-[18px]">{day.format('D')}</span>
      </div>
      {cards.map((card) => (
        <PostCard
          key={card.key}
          card={card}
          now={now}
          selected={card.key === selectedKey}
          open={open(card)}
        />
      ))}
      {future && (
        <button
          onClick={addAt(day)}
          className="min-h-[36px] rounded-[8px] border border-dashed border-newTableBorder text-[12px] text-textItemBlur hover:text-newTextColor"
        >
          + {t('add_post', 'Add post')}
        </button>
      )}
    </div>
  );
};
