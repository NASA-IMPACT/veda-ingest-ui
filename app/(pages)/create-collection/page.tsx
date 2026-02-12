import CreateCollectionClient from './_components/CreateCollectionClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function CreateCollectionPage() {
  return <CreateCollectionClient />;
}
