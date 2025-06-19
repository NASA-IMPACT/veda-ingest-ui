import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DatasetsClient from './_components/DatasetsClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function IngestPage() {
  if (DISABLE_AUTH) {
    return <DatasetsClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <DatasetsClient />;
}
