import CollectionsClient from './_components/CollectionsClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function IngestPage() {
  return <CollectionsClient />;
}
