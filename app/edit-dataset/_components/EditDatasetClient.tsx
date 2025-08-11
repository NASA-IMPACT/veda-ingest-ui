'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import PendingIngestList from '@/components/ingestion/PendingIngestList';
import EditIngestView from '@/components/ingestion/EditIngestView';

interface SelectedIngest {
  ref: string;
  title: string;
}

const EditDatasetClient = () => {
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
      {selectedIngest ? (
        <EditIngestView
          ingestionType="dataset"
          gitRef={selectedIngest.ref}
          initialTitle={selectedIngest.title}
          onComplete={handleReturnToList}
        />
      ) : (
        <PendingIngestList
          ingestionType="dataset"
          onIngestSelect={handleIngestSelect}
        />
      )}
    </AppLayout>
  );
};

export default EditDatasetClient;
