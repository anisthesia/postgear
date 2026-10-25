'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { usePathname, useSearchParams } from 'next/navigation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface Tab {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  center?: boolean;
  icon: ReactNode;
}

const openInbox = () =>
  document
    .querySelector<HTMLElement>('[data-shell-inbox] .cursor-pointer')
    ?.click();

const Svg: FC<{ d: string }> = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TabBar: FC = () => {
  const t = useT();
  const pathname = usePathname();
  const search = useSearchParams();
  const onLaunches = pathname.startsWith('/launches');
  const inQueue = onLaunches && !!search.get('display');

  const tabs: Tab[] = [
    {
      label: t('today', 'Today'),
      href: '/launches',
      active: onLaunches && !inQueue,
      icon: <Svg d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    },
    {
      label: t('queue', 'Queue'),
      href: '/launches?display=list',
      active: inQueue,
      icon: <Svg d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
    },
    {
      label: t('new', 'New'),
      href: '/launches?new=1',
      center: true,
      icon: <Svg d="M12 5v14M5 12h14" />,
    },
    {
      label: t('inbox', 'Inbox'),
      onClick: openInbox,
      icon: (
        <Svg d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7m-16 0v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5m-16 0h4l1 2h6l1-2h4" />
      ),
    },
    {
      label: t('me', 'Me'),
      href: '/settings',
      active: pathname.startsWith('/settings'),
      icon: <Svg d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-[300] flex bg-newBgColorInner border-t border-newBorder pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const className = clsx(
          'flex-1 min-h-[56px] min-w-[44px] flex flex-col items-center justify-center gap-[2px] text-[11px]',
          tab.active ? 'text-newTextColor' : 'text-textItemBlur',
          tab.center && 'text-btnPrimary'
        );
        return tab.href ? (
          <Link key={tab.label} href={tab.href} className={className}>
            {tab.icon}
            {tab.label}
          </Link>
        ) : (
          <button key={tab.label} onClick={tab.onClick} className={className}>
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
