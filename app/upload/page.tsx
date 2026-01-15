import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UploadClient from './_components/UploadClient';

export default async function UploadPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return <UploadClient />;
}
