'use client';

import { useState } from 'react';

import { Status } from '@/types/global';
import IngestForm from '@/components/IngestForm';
import uiSchema from '@/FormSchemas/uischema.json';

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
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const onFormDataSubmit = (data?: Record<string, unknown>) => {
    if (!data) {
      console.error("No form data provided.");
      return;
    }
  
    setStatus("loadingGithub");
    setCollectionName(data.collection as string);
  
    const url = "api/create-ingest";
    const requestOptions = {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    };
  
    fetch(url, requestOptions)
      .then(async (response) => {
        if (!response.ok) {
          const errorMessage = await response.text();
          setApiErrorMessage(errorMessage);
          setStatus("error");
          throw new Error(`There was an error: ${errorMessage}`);
        }
        const responseJson = await response.json();
        setPullRequestUrl(responseJson.githubURL);
        setFormData({});
        setStatus("success");
      })
      .catch((error) => {
        console.error(error);
        setStatus("error");
      });
  };
  

  return (
    <IngestForm
      uiSchema={uiSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onFormDataSubmit}
    />
  );
}

export default IngestCreationForm;
