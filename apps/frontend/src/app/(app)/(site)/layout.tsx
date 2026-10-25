import { getDevice } from '@gitroom/frontend/components/shell/device';
import { DesktopShell } from '@gitroom/frontend/components/shell/desktop/desktop.shell';
import { MobileShell } from '@gitroom/frontend/components/shell/mobile/mobile.shell';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const device = await getDevice();
  const Shell = device === 'mobile' ? MobileShell : DesktopShell;
  return <Shell>{children}</Shell>;
}
