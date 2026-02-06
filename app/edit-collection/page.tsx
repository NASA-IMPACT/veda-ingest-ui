import EditCollectionClient from './_components/EditCollectionClient';

// Force static generation - authentication and authorization handled by middleware
export const dynamic = 'force-static';

export default function EditIngestPage() {
  return <EditCollectionClient />;
}
