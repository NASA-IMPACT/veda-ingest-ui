'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import ExistingCollectionsList from '@/components/ingestion/ExistingCollectionsList';
import EditCollectionView from '@/components/ingestion/EditCollectionView';
import {
  TenantErrorBoundary,
  APIErrorBoundary,
} from '@/components/error-boundaries';
import { Alert } from 'antd';

const EditExistingCollectionClient = () => {
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const handleCollectionSelect = (data: any) => {
    setSelectedCollection(data);
  };

  const handleReturnToList = () => {
    setSelectedCollection(null);
  };

  return (
    <AppLayout>
      <TenantErrorBoundary>
        <APIErrorBoundary
          onRetry={() => {
            // If editing, return to list to retry
            if (selectedCollection) {
              setSelectedCollection(null);
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
          {selectedCollection ? (
            <EditCollectionView
              collectionData={selectedCollection}
              onComplete={handleReturnToList}
            />
          ) : (
            <ExistingCollectionsList
              onCollectionSelect={handleCollectionSelect}
            />
          )}
        </APIErrorBoundary>
      </TenantErrorBoundary>
    </AppLayout>
  );
};

export default EditExistingCollectionClient;
