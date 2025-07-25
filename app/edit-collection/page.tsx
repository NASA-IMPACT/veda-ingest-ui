import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditCollectionClient from './_components/EditCollectionClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function EditIngestPage() {
  if (DISABLE_AUTH) {
    return <EditCollectionClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <EditCollectionClient />;
}
