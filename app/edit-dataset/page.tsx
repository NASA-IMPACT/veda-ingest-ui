import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditDatasetClient from './_components/EditDatasetClient';

export default async function EditDatasetPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!session.scopes?.includes('dataset:update')) {
    redirect('/unauthorized');
  }

  return <EditDatasetClient />;
}
