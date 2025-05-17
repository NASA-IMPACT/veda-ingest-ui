// app/create-ingest/page.tsx (Server Component)
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateIngestClient from './_components/CreateIngestClient'; // Your original CreateIngest component

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function CreateIngestPage() {
  if (DISABLE_AUTH) {
    return <CreateIngestClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CreateIngestClient />;
}
