import CogViewerClient from './_components/CogViewerClient';

// Force static generation - authentication is handled by middleware
export const dynamic = 'force-static';

export default function CogViewerPage() {
  return <CogViewerClient />;
}
