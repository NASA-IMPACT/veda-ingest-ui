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

type ExistingCollectionData = Record<string, unknown>;

const EditExistingCollectionClient = () => {
  const [selectedCollection, setSelectedCollection] =
    useState<ExistingCollectionData | null>(null);

  const handleCollectionSelect = (data: ExistingCollectionData) => {
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
