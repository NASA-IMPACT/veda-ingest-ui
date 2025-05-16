import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CogViewerClient from './_components/CogViewerClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function CogViewerPage() {
  if (DISABLE_AUTH) {
    return <CogViewerClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CogViewerClient />;
}
