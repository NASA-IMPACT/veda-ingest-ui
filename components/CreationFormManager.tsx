'use client';

import React, { useState } from 'react';
import { Card, Typography, Alert } from 'antd';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/CollectionIngestionForm';

const { Title } = Typography;

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
    const payload = {
      data: data,
      ingestionType: formType,
    };

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    };

    fetch(url, requestOptions)
      .then(async (response) => {
        if (!response.ok) {
          const errorMessage = await response.text();
          setApiErrorMessage(errorMessage);
          setStatus('error');
          return;
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

  const title = `Create New ${formType.charAt(0).toUpperCase() + formType.slice(1)}`;

  return (
    <Card>
      <Title level={2} style={{ marginBottom: '24px' }}>
        {title}
      </Title>

      {formType === 'dataset' ? (
        <DatasetIngestionForm
          {...childFormProps}
          defaultTemporalExtent={true}
        />
      ) : formType === 'collection' ? (
        <CollectionIngestionForm {...childFormProps} />
      ) : (
        <Alert
          message="Invalid formType specified. Please use dataset or collection."
          type="error"
          showIcon
        />
      )}
    </Card>
  );
};

export default CreationFormManager;
