import DatasetsClient from './_components/DatasetsClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function IngestPage() {
  return <DatasetsClient />;
}
