import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditDatasetClient from './_components/EditDatasetClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function EditDatasetPage() {
  if (DISABLE_AUTH) {
    return <EditDatasetClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Check if user has the required scope to edit ingests
  if (!session.scopes?.includes('dataset:update')) {
    redirect('/unauthorized');
  }

  return <EditDatasetClient />;
}
