'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import useSWR from 'swr';
import { CopilotKit } from '@copilotkit/react-core';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { setSentryUser } from '@gitroom/react/sentry/initialize.sentry.client';
import { setUserTimezone } from '@gitroom/frontend/components/layout/set.timezone';
import {
  ATTENTION_SLOT_ID,
  COMPOSE_SLOT_ID,
  TOPBAR_SLOT_ID,
  TopBar,
  TopBarToolbar,
} from '@gitroom/frontend/components/shell/desktop/top.bar';
import {
  CHANNELS_SLOT_ID,
  Rail,
} from '@gitroom/frontend/components/shell/desktop/rail';
import { ComposePanel } from '@gitroom/frontend/components/compose/compose.panel';
import { AttentionStrip } from '@gitroom/frontend/components/shell/desktop/attention.strip';
import { ChannelsList } from '@gitroom/frontend/components/shell/desktop/channels.list';
import {
  CommandPalette,
  PaletteBridge,
} from '@gitroom/frontend/components/shell/desktop/command.palette';
import {
  CalendarShortcuts,
  NavShortcuts,
} from '@gitroom/frontend/components/shell/desktop/shortcuts';

type Slots = {
  topbar: HTMLElement;
  attention: HTMLElement;
  channels: HTMLElement;
  compose: HTMLElement;
};

// The shell slots the calendar page fills, null when there is no desktop shell
export const useShellSlots = () => {
  const [slots, setSlots] = useState<Slots | null>(() => {
    if (typeof document === 'undefined') {
      return null;
    }
    const topbar = document.getElementById(TOPBAR_SLOT_ID);
    const attention = document.getElementById(ATTENTION_SLOT_ID);
    const channels = document.getElementById(CHANNELS_SLOT_ID);
    const compose = document.getElementById(COMPOSE_SLOT_ID);
    return topbar && attention && channels && compose
      ? { topbar, attention, channels, compose }
      : null;
  });
  useEffect(() => {
    const topbar = document.getElementById(TOPBAR_SLOT_ID);
    const attention = document.getElementById(ATTENTION_SLOT_ID);
    const channels = document.getElementById(CHANNELS_SLOT_ID);
    const compose = document.getElementById(COMPOSE_SLOT_ID);
    setSlots(
      topbar && attention && channels && compose
        ? { topbar, attention, channels, compose }
        : null
    );
  }, []);
  return slots;
};

// Rendered by the calendar page inside the calendar provider
export const DesktopShellPortals: FC<{ slots: Slots }> = ({ slots }) => (
  <>
    {createPortal(<TopBarToolbar />, slots.topbar)}
    {createPortal(<AttentionStrip />, slots.attention)}
    {createPortal(<ChannelsList />, slots.channels)}
    {createPortal(<ComposePanel />, slots.compose)}
    <CalendarShortcuts />
    <PaletteBridge />
  </>
);

export const DesktopShell: FC<{ children: ReactNode }> = ({ children }) => {
  const fetch = useFetch();
  const { backendUrl } = useVariables();
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);
  const { data: user } = useSWR('/user/self', load, {
    // set before anything renders a date in the user's timezone
    onSuccess: (data) => setUserTimezone(data?.timezoneName),
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  useEffect(() => {
    setSentryUser(
      user ? { id: user.id, email: user.email, orgId: user.orgId } : null
    );
  }, [user]);

  if (!user) return null;

  return (
    <ContextWrapper user={user}>
      <CopilotKit
        credentials="include"
        runtimeUrl={backendUrl + '/copilot/chat'}
        useSingleEndpoint={true}
        showDevConsole={false}
      >
        <MantineWrapper>
          <ToolTip />
          <Toaster />
          <ShowMediaBoxModal />
          <ShowLinkedinCompany />
          <MediaSettingsLayout />
          <ShowPostSelector />
          <ContinueProvider />
          <NavShortcuts />
          <CommandPalette />
          <div className="flex flex-col min-h-screen min-w-screen text-newTextColor p-[12px]">
            <div>{user?.admin ? <Impersonate /> : <div />}</div>
            <div className="flex-1 flex gap-[8px]">
              <Rail />
              <div className="flex-1 min-w-0 bg-newBgLineColor rounded-[12px] overflow-hidden flex flex-col gap-[1px] blurMe">
                <TopBar />
                <div id={ATTENTION_SLOT_ID} className="flex flex-col empty:hidden" />
                <div className={clsx('flex flex-1 min-w-0 gap-[1px]')}>
                  {children}
                  <div id={COMPOSE_SLOT_ID} className="flex empty:hidden" />
                </div>
              </div>
            </div>
          </div>
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
  );
};
