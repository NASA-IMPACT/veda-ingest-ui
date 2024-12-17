'use client';

import { useState } from 'react';
import { RJSFSchema } from '@rjsf/utils';


import { Status } from '@/types/global';
import IngestForm from './IngestForm';
import jsonSchema from '@/FormSchemas/jsonschema.json';


function IngestCreationForm({
  setStatus,
  setCollectionName,
  setApiErrorMessage,
  setPullRequestUrl,
}: {
  setStatus: (status: Status) => void;
  setCollectionName: (collectionName: string) => void;
  setApiErrorMessage: (apiErrorMessage: string) => void;
  setPullRequestUrl: (PullRequestUrl: string) => void;
}) {
  const [formData, setFormData] = useState<RJSFSchema>({});

  // @ts-expect-error testing
  const onFormDataSubmit = async ({ formData }) => {
    setStatus('loading');
    setCollectionName(formData.collection);

    const url = 'api/create-ingest';
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' },
    };
    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorMessage = await response.text();
        setApiErrorMessage(errorMessage);
        setStatus('error');
        throw new Error(`There was an error: ${errorMessage}`);
      }

      const responseJson = await response.json();
      setPullRequestUrl(responseJson.githubURL);
      setFormData({});
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <IngestForm
      schema={jsonSchema}
      formData={formData}
      setFormData={setFormData}
      // @ts-expect-error testing
      onSubmit={onFormDataSubmit}
    />
  );
}

export default IngestCreationForm;
