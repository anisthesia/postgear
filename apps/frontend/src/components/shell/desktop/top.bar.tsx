'use client';

import { FC } from 'react';
import dynamic from 'next/dynamic';
import { Filters } from '@gitroom/frontend/components/launches/filters';
import { NewPost } from '@gitroom/frontend/components/launches/new.post';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { Title } from '@gitroom/frontend/components/layout/title';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  { ssr: false }
);

export const TOPBAR_SLOT_ID = 'shell-topbar-slot';
export const ATTENTION_SLOT_ID = 'shell-attention-slot';

// What the calendar page portals into the top bar: it needs the calendar context
export const TopBarToolbar: FC = () => (
  <>
    <Filters />
    <div data-shell-new-post="" className="flex">
      <NewPost />
    </div>
  </>
);

export const TopBar: FC = () => {
  const t = useT();
  return (
    <div className="flex bg-newBgColorInner min-h-[56px] px-[16px] gap-[12px] items-center">
      <div className="text-[18px] font-[600] flex min-w-0 empty:hidden [&:has(#shell-topbar-slot>*)]:hidden">
        <Title />
      </div>
      <div id={TOPBAR_SLOT_ID} className="flex flex-1 min-w-0 items-center gap-[12px]" />
      <button
        disabled
        className="hidden xl:flex items-center gap-[8px] h-[32px] px-[10px] rounded-[8px] bg-btnSimple text-textItemBlur text-[13px] cursor-default"
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
