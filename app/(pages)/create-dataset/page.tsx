import CreateIngestClient from './_components/CreateIngestClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function CreateIngestPage() {
  return <CreateIngestClient />;
}
