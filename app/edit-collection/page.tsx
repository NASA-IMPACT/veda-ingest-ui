import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditCollectionClient from './_components/EditCollectionClient';

export default async function EditIngestPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!session.scopes?.includes('dataset:update')) {
    redirect('/unauthorized');
  }

  return <EditCollectionClient />;
}
