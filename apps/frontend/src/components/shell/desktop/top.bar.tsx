'use client';

import { FC } from 'react';
import dynamic from 'next/dynamic';
import { Filters } from '@gitroom/frontend/components/launches/filters';
import { openCompose } from '@gitroom/frontend/components/compose/use.compose';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { usePathname } from 'next/navigation';
import { openPalette } from '@gitroom/frontend/components/shell/desktop/palette.items';
import { Title } from '@gitroom/frontend/components/layout/title';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  { ssr: false }
);

export const TOPBAR_SLOT_ID = 'shell-topbar-slot';
export const ATTENTION_SLOT_ID = 'shell-attention-slot';
export const COMPOSE_SLOT_ID = 'shell-compose-slot';

const NewPostButton: FC = () => {
  const t = useT();
  return (
    <button
      onClick={openCompose}
      className="text-accentFg pt-[12px] pb-[14px] ps-[16px] pe-[20px] min-h-[44px] max-h-[44px] rounded-md bg-btnPrimary whitespace-nowrap shrink-0 flex justify-center items-center gap-[5px] outline-none text-[14px]"
    >
      <span className="text-[18px] leading-none">+</span>
      {t('create_new_post', 'Create Post')}
    </button>
  );
};

// What the calendar page portals into the top bar: it needs the calendar context
export const TopBarToolbar: FC = () => (
  <>
    <Filters />
    <div data-shell-new-post="" className="flex">
      <NewPostButton />
    </div>
  </>
);

export const TopBar: FC = () => {
  const t = useT();
  const pathname = usePathname();
  return (
    <div className="flex bg-newBgColorInner min-h-[56px] px-[16px] gap-[12px] items-center">
      <div className="text-[18px] font-[600] flex min-w-0 empty:hidden [&:has(#shell-topbar-slot>*)]:hidden">
        {pathname.indexOf('/inbox') === 0 ? (
          <h1 className="truncate">{t('inbox', 'Inbox')}</h1>
        ) : (
          <Title />
        )}
      </div>
      <div id={TOPBAR_SLOT_ID} className="flex flex-1 min-w-0 items-center gap-[12px]" />
      <button
        onClick={openPalette}
        className="hidden xl:flex items-center gap-[8px] h-[32px] px-[10px] rounded-[8px] bg-btnSimple text-textItemBlur text-[13px]"
      >
        {t('search', 'Search')}
        <kbd className="text-[11px] font-sans">⌘K</kbd>
      </button>
      <div className="flex gap-[16px] items-center text-textItemBlur">
        <div className="hover:text-newTextColor">
          <ModeComponent />
        </div>
        <LanguageComponent />
        <ChromeExtensionComponent />
        <AttachToFeedbackIcon />
        <div data-shell-inbox="">
          <NotificationComponent />
        </div>
      </div>
    </div>
  );
};
