'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import PendingIngestList from '@/components/ingestion/PendingIngestList';
import EditIngestView from '@/components/ingestion/EditIngestView';
import {
  TenantErrorBoundary,
  APIErrorBoundary,
} from '@/components/error-boundaries';

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
          {selectedIngest ? (
            <EditIngestView
              ingestionType="collection"
              gitRef={selectedIngest.ref}
              initialTitle={selectedIngest.title}
              onComplete={handleReturnToList}
            />
          ) : (
            <PendingIngestList
              ingestionType="collection"
              onIngestSelect={handleIngestSelect}
            />
          )}
        </APIErrorBoundary>
      </TenantErrorBoundary>
    </AppLayout>
  );
};

export default EditExistingCollectionClient;
