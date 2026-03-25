import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EditExistingCollectionClient from './_components/EditExistingCollectionClient';

export const dynamic = 'force-dynamic';

const isAllowedAppEnv = () => {
  const env = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  return env === 'veda' || env === 'local';
};

export default async function EditExistingCollectionPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (
    !isAllowedAppEnv() ||
    !session.scopes?.includes('stac:collection:update')
  ) {
    redirect('/unauthorized');
  }

  return <EditExistingCollectionClient />;
}
