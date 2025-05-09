import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import EditIngestClient from './_components/EditIngestClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function EditIngestPage() {
  if (DISABLE_AUTH) {
    return <EditIngestClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <EditIngestClient />;
}
