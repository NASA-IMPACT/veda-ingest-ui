'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import ExistingCollectionsList from '@/components/ingestion/ExistingCollectionsList';
import EditIngestView from '@/components/ingestion/EditIngestView';
import {
  TenantErrorBoundary,
  APIErrorBoundary,
} from '@/components/error-boundaries';
import { Alert } from 'antd';

interface SelectedIngest {
  ref: string;
  title: string;
}

const EditExistingCollectionClient = () => {
  const [selectedIngest, setSelectedIngest] = useState<SelectedIngest | null>(
    null
  );

  const handleIngestSelect = (ref: string, title: string) => {
    setSelectedIngest({ ref, title });
  };

  const handleReturnToList = () => {
    setSelectedIngest(null);
  };

  return (
    <AppLayout>
      <TenantErrorBoundary>
        <APIErrorBoundary
          onRetry={() => {
            // If editing, return to list to retry
            if (selectedIngest) {
              setSelectedIngest(null);
            }
            // Otherwise, the component will re-render and retry automatically
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              width: '100%',
            }}
            aria-live="assertive"
            role="alert"
          >
            <Alert
              message="Warning: Changes here will affect the published collection."
              type="warning"
              showIcon
              banner
            />
            <div style={{ paddingBottom: 16 }} />
          </div>
          {selectedIngest ? (
            <EditIngestView
              ingestionType="collection"
              gitRef={selectedIngest.ref}
              initialTitle={selectedIngest.title}
              onComplete={handleReturnToList}
            />
          ) : (
            <ExistingCollectionsList onCollectionSelect={handleIngestSelect} />
          )}
        </APIErrorBoundary>
      </TenantErrorBoundary>
    </AppLayout>
  );
};

export default EditExistingCollectionClient;
