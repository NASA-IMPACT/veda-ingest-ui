import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateCollectionClient from './_components/CreateCollectionClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function CreateCollectionPage() {
  if (DISABLE_AUTH) {
    return <CreateCollectionClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CreateCollectionClient />;
}
