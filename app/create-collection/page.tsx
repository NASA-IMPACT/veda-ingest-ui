import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CreateCollectionClient from './_components/CreateCollectionClient';

export default async function CreateCollectionPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CreateCollectionClient />;
}
