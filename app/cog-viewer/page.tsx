import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CogViewerClient from './_components/CogViewerClient';

export default async function CogViewerPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CogViewerClient />;
}
