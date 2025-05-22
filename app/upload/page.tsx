import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UploadClient from './_components/UploadClient';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export default async function UploadPage() {
  if (DISABLE_AUTH) {
    return <UploadClient />;
  }

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <UploadClient />;
}
