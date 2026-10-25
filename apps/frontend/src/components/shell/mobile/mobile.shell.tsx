'use client';

import { FC, ReactNode, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
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
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import { TabBar } from '@gitroom/frontend/components/shell/mobile/tab.bar';

// same light/dark switch as the desktop top bar: the `mode` cookie sets the body class
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  { ssr: false }
);

export const MobileShell: FC<{ children: ReactNode }> = ({ children }) => {
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
          <div className="flex flex-col min-h-screen text-newTextColor pb-[calc(72px+env(safe-area-inset-bottom))]">
            {user?.admin && <Impersonate />}
            <header className="flex items-center justify-between px-[12px] pt-[env(safe-area-inset-top)] h-[56px] bg-newBgColorInner">
              <div className="flex items-center gap-[8px]">
                <div className="[&_svg]:!min-w-[28px] [&_svg]:!min-h-[28px] [&_svg]:!w-[28px] [&_svg]:!h-[28px] [&_svg]:!mt-0">
                  <Logo />
                </div>
                <div className="text-[14px] font-[600] text-textItemFocused">
                  postgear
                </div>
              </div>
              <div className="flex items-center gap-[16px] text-textItemBlur">
                <ModeComponent />
                <div data-shell-inbox="">
                  <NotificationComponent />
                </div>
              </div>
            </header>
            <main className="flex-1 min-w-0 flex flex-col">{children}</main>
          </div>
          <TabBar />
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
  );
};
