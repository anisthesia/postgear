'use client';

import { FC, ReactNode, useCallback, useEffect } from 'react';
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
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import { TabBar } from '@gitroom/frontend/components/shell/mobile/tab.bar';

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
              <div className="scale-[0.6] origin-left h-[40px] overflow-hidden">
                <Logo />
              </div>
              <div data-shell-inbox="" className="text-textItemBlur">
                <NotificationComponent />
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
