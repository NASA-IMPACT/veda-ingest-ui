'use client';

import React, { useState, useCallback } from 'react';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/CollectionIngestionForm';

interface CreationFormManagerProps {
  formType: 'dataset' | 'collection';
  setStatus: (status: Status) => void;
  setCollectionName: (collectionName: string) => void;
  setApiErrorMessage: (apiErrorMessage: string) => void;
  setPullRequestUrl: (pullRequestUrl: string) => void;
}

const CreationFormManager: React.FC<CreationFormManagerProps> = ({
  formType,
  setStatus,
  setCollectionName,
  setApiErrorMessage,
  setPullRequestUrl,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const onFormDataSubmit = (data?: Record<string, unknown>) => {
    if (!data) {
      console.error('No form data provided.');
      return;
    }

    setStatus('loadingGithub');
    setCollectionName(data.collection as string);

    const url = 'api/create-ingest';
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };

    fetch(url, requestOptions)
      .then(async (response) => {
        if (!response.ok) {
          const errorMessage = await response.text();
          setApiErrorMessage(errorMessage);
          setStatus('error');
        }
        const responseJson = await response.json();
        setPullRequestUrl(responseJson.githubURL);
        setFormData({});
        setStatus('success');
      })
      .catch((error) => {
        console.error(error);
        setStatus('error');
      });
  };

  const childFormProps = {
    formData,
    setFormData,
    onSubmit: onFormDataSubmit,
    isEditMode: false, // Explicitly false for creation
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Create New {formType.charAt(0).toUpperCase() + formType.slice(1)}
      </h2>

      {formType === 'dataset' ? (
        <DatasetIngestionForm
          {...childFormProps}
          defaultTemporalExtent={true}
        />
      ) : formType === 'collection' ? (
        <CollectionIngestionForm {...childFormProps} />
      ) : (
        <div className="text-red-500 text-center p-4">
          Invalid formType specified. Please use dataset or collection.
        </div>
      )}
    </div>
  );
};

export default CreationFormManager;
