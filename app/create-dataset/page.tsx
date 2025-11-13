import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateIngestClient from './_components/CreateIngestClient';

export default async function CreateIngestPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CreateIngestClient />;
}
