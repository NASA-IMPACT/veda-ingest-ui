'use client';

import AppLayout from '@/components/Layout';
import { Input, message } from 'antd';
import { useCOGViewer } from '@/hooks/useCOGViewer';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically load the COGViewerContent component to prevent SSR issues
const COGViewerContent = dynamic(
  () => import('@/components/COGViewerContent'),
  {
    ssr: false,
  }
);

const CogViewerClient = function CogViewerClient() {
  const cogViewer = useCOGViewer();

  return (
    <AppLayout>
      <div
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #ddd',
          }}
        >
          <Input.Search
            placeholder="Enter COG URL"
            enterButton="Load"
            onSearch={(url) => {
              const trimmedUrl = url.trim();
              if (!trimmedUrl) {
                message.error('Please enter a valid URL.');
                return;
              }
              cogViewer.setCogUrl(trimmedUrl);
              cogViewer.fetchMetadata(trimmedUrl);
            }}
            loading={cogViewer.loading}
            style={{ width: '100%' }}
          />
        </div>

        <COGViewerContent {...cogViewer} />
      </div>
    </AppLayout>
  );
};

export default CogViewerClient;
