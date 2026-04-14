import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EditExistingCollectionClient from './_components/EditExistingCollectionClient';

export const dynamic = 'force-dynamic';

export default async function EditExistingCollectionPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!session.scopes?.includes('stac:collection:update')) {
    redirect('/unauthorized');
  }

  return <EditExistingCollectionClient />;
}
