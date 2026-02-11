import UploadClient from './_components/UploadClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function UploadPage() {
  return <UploadClient />;
}
