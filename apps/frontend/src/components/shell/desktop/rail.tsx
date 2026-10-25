'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { useMenuItem } from '@gitroom/frontend/components/layout/top.menu';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useInbox } from '@gitroom/frontend/components/inbox/use.inbox';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface RailEntry {
  label: string;
  hint: string;
  path: string;
  icon: ReactNode;
  badge?: number;
  children?: { label: string; path: string }[];
}

const Icon: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0 [&>svg]:max-w-[18px] [&>svg]:max-h-[18px]">
    {children}
  </div>
);

export const CHANNELS_SLOT_ID = 'shell-channels-slot';

export const Rail: FC = () => {
  const t = useT();
  const user = useUser();
  const pathname = usePathname();
  const { all } = useMenuItem();
  const { data: inbox } = useInbox(1);
  const needsMe = inbox
    ? inbox.counts.failed + inbox.counts.approvals + inbox.counts.changesRequested
    : 0;
  const icon = (path: string) => all.find((i) => i.path === path)?.icon;

  const entries: RailEntry[] = [
    { label: t('queue', 'Queue'), hint: 'G Q', path: '/launches', icon: icon('/launches') },
    {
      label: t('inbox', 'Inbox'),
      hint: 'G I',
      path: '/inbox',
      badge: needsMe,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7m-16 0v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5m-16 0h4l1 2h6l1-2h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    { label: t('analytics', 'Analytics'), hint: 'G A', path: '/analytics', icon: icon('/analytics') },
    { label: t('media', 'Media'), hint: 'G M', path: '/media', icon: icon('/media') },
    {
      label: t('automations', 'Automations'),
      hint: 'G U',
      path: '/plugs',
      icon: icon('/agents'),
      children: [
        { label: t('plugs', 'Plugs'), path: '/plugs' },
        { label: 'Agent', path: '/agents' },
        { label: t('third_party', 'Third party'), path: '/third-party' },
      ],
    },
    { label: t('settings', 'Settings'), hint: 'G S', path: '/settings', icon: icon('/settings') },
  ];

  const isActive = (entry: RailEntry) =>
    !!entry.path &&
    (pathname.indexOf(entry.path) === 0 ||
      !!entry.children?.some((c) => pathname.indexOf(c.path) === 0));

  return (
    <div className="flex flex-col w-[220px] shrink-0 bg-newBgColorInner rounded-[12px] p-[8px] gap-[12px] overflow-y-auto">
      <div className="flex items-center gap-[8px] px-[4px]">
        <div className="[&_svg]:!min-w-[28px] [&_svg]:!min-h-[28px] [&_svg]:!w-[28px] [&_svg]:!h-[28px] [&_svg]:!mt-0">
          <Logo />
        </div>
        <div className="flex-1 min-w-0 text-[14px] font-[600] text-textItemFocused">
          postgear
        </div>
      </div>
      <div className="px-[4px] text-[13px]">
        <OrganizationSelector />
      </div>
      {user?.orgId && (
        <div className="flex flex-col gap-[2px]">
          {entries.map((entry) => {
            const active = isActive(entry);
            const className = clsx(
              'flex items-center gap-[10px] px-[8px] h-[34px] rounded-[8px] text-[14px] font-[500] hover:bg-boxFocused hover:text-textItemFocused transition-colors',
              active ? 'bg-boxFocused text-textItemFocused' : 'text-textItemBlur'
            );
            const inner = (
              <>
                <Icon>{entry.icon}</Icon>
                <span className="flex-1 text-start">{entry.label}</span>
                {!!entry.badge && (
                  <span className="min-w-[18px] h-[18px] px-[5px] rounded-full bg-btnPrimary text-white text-[11px] font-[600] flex items-center justify-center">
                    {entry.badge}
                  </span>
                )}
                <kbd className="text-[10px] text-textItemBlur/70 font-sans">
                  {entry.hint}
                </kbd>
              </>
            );
            return (
              <div key={entry.label} className="flex flex-col">
                <Link prefetch={true} href={entry.path} className={className}>
                  {inner}
                </Link>
                {active &&
                  entry.children?.map((child) => (
                    <Link
                      key={child.path}
                      href={child.path}
                      className={clsx(
                        'ps-[38px] h-[28px] flex items-center text-[13px] hover:text-textItemFocused',
                        pathname.indexOf(child.path) === 0
                          ? 'text-textItemFocused'
                          : 'text-textItemBlur'
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
      )}
      <div id={CHANNELS_SLOT_ID} className="flex flex-col" />
    </div>
  );
};
