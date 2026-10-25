import dayjs from 'dayjs';
import { uniqBy } from 'lodash';

export type PaletteDisplay = 'day' | 'week' | 'month' | 'list' | 'board';
export type PaletteGroup = 'actions' | 'posts' | 'goto';

export interface PaletteItem {
  id: string;
  group: PaletteGroup;
  label: string;
  secondary?: string;
  hint?: string;
  run: () => void;
}

// What the calendar page lends to the palette, the palette itself lives
// outside of the calendar provider. Null on pages without a calendar.
export interface CalendarBridge {
  customer: string | null;
  integrations: { id: string; name: string; customer?: { id?: string; name?: string } }[];
  setDisplay: (display: PaletteDisplay) => void;
  today: () => void;
  jumpTo: (date: dayjs.Dayjs) => void;
  setCustomer: (customer: string) => void;
  newPost: () => void;
  openPost: (post: any) => void;
  editSlots: (integrationId: string) => void;
}

let bridge: CalendarBridge | null = null;
export const registerCalendarBridge = (next: CalendarBridge | null) => {
  bridge = next;
};
export const getCalendarBridge = () => bridge;

const OPEN_EVENT = 'pg-palette-open';
export const openPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onOpenPalette = (listener: () => void) => {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
};

// A prefix of the label or of any of its words, returns the matched range
export const matchRange = (
  label: string,
  query: string
): [number, number] | null => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return null;
  }
  const lower = label.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    if ((i === 0 || /[^a-z0-9]/.test(lower[i - 1])) && lower.startsWith(q, i)) {
      return [i, i + q.length];
    }
  }
  return null;
};

interface BuildOptions {
  t: (key: string, fallback: string) => string;
  go: (path: string) => () => void;
  openInbox: () => void;
  query: string;
  organizations: { id: string; name: string }[];
  currentOrg?: string;
  changeOrg: (id: string) => () => void;
}

// The static items: actions and go to, posts come from the search hook
export const buildItems = ({
  t,
  go,
  openInbox,
  query,
  organizations,
  currentOrg,
  changeOrg,
}: BuildOptions): PaletteItem[] => {
  const calendar = getCalendarBridge();
  const actions: PaletteItem[] = calendar
    ? [
        { id: 'new-post', group: 'actions', label: t('new_post', 'New post'), hint: 'N', run: calendar.newPost },
        { id: 'today', group: 'actions', label: t('jump_to_today', 'Jump to today'), hint: 'T', run: calendar.today },
        { id: 'board', group: 'actions', label: t('switch_to_board', 'Switch to board'), hint: '5', run: () => calendar.setDisplay('board') },
        { id: 'week', group: 'actions', label: t('switch_to_week', 'Switch to week'), hint: '2', run: () => calendar.setDisplay('week') },
        { id: 'month', group: 'actions', label: t('switch_to_month', 'Switch to month'), hint: '3', run: () => calendar.setDisplay('month') },
        { id: 'list', group: 'actions', label: t('switch_to_list', 'Switch to list'), hint: '4', run: () => calendar.setDisplay('list') },
        ...calendar.integrations.map((integration) => ({
          id: `slots-${integration.id}`,
          group: 'actions' as const,
          label: `${t('edit_posting_slots', 'Edit posting slots')}: ${integration.name}`,
          run: () => calendar.editSlots(integration.id),
        })),
      ]
    : [];

  // a typed ISO date becomes a jump to that date
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.trim()) ? dayjs(query.trim()) : null;
  if (calendar && date?.isValid()) {
    actions.unshift({
      id: 'jump-date',
      group: 'goto',
      label: `${t('jump_to_date', 'Jump to date')} ${query.trim()}`,
      run: () => calendar.jumpTo(date),
    });
  }

  const customers = calendar
    ? uniqBy(
        calendar.integrations.filter((i) => i.customer?.id),
        (i) => i.customer!.id
      ).map((i) => ({
        id: `customer-${i.customer!.id}`,
        group: 'goto' as const,
        label: `${t('switch_customer', 'Switch customer')}: ${i.customer!.name}`,
        run: () => calendar.setCustomer(i.customer!.id!),
      }))
    : [];

  const workspaces = organizations
    .filter((org) => org.id !== currentOrg)
    .map((org) => ({
      id: `org-${org.id}`,
      group: 'goto' as const,
      label: `${t('switch_workspace', 'Switch workspace')}: ${org.name}`,
      run: changeOrg(org.id),
    }));

  const destinations: PaletteItem[] = [
    { id: 'go-queue', group: 'goto', label: t('queue', 'Queue'), hint: 'G Q', run: go('/launches') },
    { id: 'go-inbox', group: 'goto', label: t('inbox', 'Inbox'), hint: 'G I', run: openInbox },
    { id: 'go-analytics', group: 'goto', label: t('analytics', 'Analytics'), hint: 'G A', run: go('/analytics') },
    { id: 'go-media', group: 'goto', label: t('media', 'Media'), hint: 'G M', run: go('/media') },
    { id: 'go-plugs', group: 'goto', label: t('automations', 'Automations'), hint: 'G U', run: go('/plugs') },
    { id: 'go-settings', group: 'goto', label: t('settings', 'Settings'), hint: 'G S', run: go('/settings') },
  ];

  return [...actions, ...destinations, ...customers, ...workspaces];
};
