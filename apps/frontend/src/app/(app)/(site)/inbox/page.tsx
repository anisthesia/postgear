import { Inbox } from '@gitroom/frontend/components/inbox/inbox';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `postgear Inbox`,
  description: '',
};

export default async function Page() {
  return <Inbox />;
}
