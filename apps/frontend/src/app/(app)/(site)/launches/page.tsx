export const dynamic = 'force-dynamic';
import { LaunchesComponent } from '@gitroom/frontend/components/launches/launches.component';
import { Today } from '@gitroom/frontend/components/shell/mobile/today';
import { getDevice } from '@gitroom/frontend/components/shell/device';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: `postgear Calendar`,
  description: '',
};
export default async function Index({
  searchParams,
}: {
  searchParams: Promise<{ display?: string }>;
}) {
  const device = await getDevice();
  const { display } = await searchParams;
  // mobile lands on Today, the Queue tab and any explicit display keep the calendar
  if (device === 'mobile' && !display) {
    return <Today />;
  }
  return <LaunchesComponent />;
}
