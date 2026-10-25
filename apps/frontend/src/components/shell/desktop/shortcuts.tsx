'use client';

import { FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';

type Display = 'day' | 'week' | 'month' | 'list';

const getDateRange = (display: Display) => {
  const date = newDayjs();
  switch (display) {
    case 'week':
      return {
        startDate: date.startOf('isoWeek').format('YYYY-MM-DD'),
        endDate: date.endOf('isoWeek').format('YYYY-MM-DD'),
      };
    case 'month':
      return {
        startDate: date.startOf('month').format('YYYY-MM-DD'),
        endDate: date.endOf('month').format('YYYY-MM-DD'),
      };
    default:
      return {
        startDate: date.format('YYYY-MM-DD'),
        endDate: date.format('YYYY-MM-DD'),
      };
  }
};

// keys are ignored inside inputs, textareas and contenteditable (the editor) by default
const options = { preventDefault: true };

// Shell-level shortcuts, they don't need the calendar
export const NavShortcuts: FC = () => {
  const router = useRouter();
  const go = useCallback((path: string) => () => router.push(path), [router]);

  useHotkeys('g>q', go('/launches'), options);
  useHotkeys('g>a', go('/analytics'), options);
  useHotkeys('g>m', go('/media'), options);
  useHotkeys('g>u', go('/plugs'), options);
  useHotkeys('g>s', go('/settings'), options);
  useHotkeys(
    'g>i',
    () =>
      document
        .querySelector<HTMLElement>('[data-shell-inbox] .cursor-pointer')
        ?.click(),
    options
  );
  // reserved for the command palette
  useHotkeys('mod+k', () => {}, { preventDefault: true });
  return null;
};

// Calendar shortcuts, mounted inside the calendar provider
export const CalendarShortcuts: FC = () => {
  const calendar = useCalendar();

  const setDisplay = useCallback(
    (display: Display) => () => {
      calendar.setFilters({
        ...getDateRange(display),
        display,
        customer: calendar.customer,
      });
    },
    [calendar]
  );

  useHotkeys('1', setDisplay('day'), options);
  useHotkeys('2', setDisplay('week'), options);
  useHotkeys('3', setDisplay('month'), options);
  useHotkeys('4', setDisplay('list'), options);
  useHotkeys('t', () => setDisplay(calendar.display as Display)(), options);
  useHotkeys(
    'n',
    () =>
      document
        .querySelector<HTMLElement>('[data-shell-new-post] button')
        ?.click(),
    options
  );
  return null;
};
