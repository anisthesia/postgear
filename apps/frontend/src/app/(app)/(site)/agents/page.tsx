import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'postgear - Agent',
  description: '',
};

export default async function Page() {
  return redirect('/agents/new');
}
