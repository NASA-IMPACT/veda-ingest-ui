import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CollectionsClient from './_components/CollectionsClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function IngestPage() {
  if (DISABLE_AUTH) {
    return <CollectionsClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CollectionsClient />;
}
