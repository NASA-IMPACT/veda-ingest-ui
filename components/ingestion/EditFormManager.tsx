'use client';

import React, { useState } from 'react';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/ingestion/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/ingestion/CollectionIngestionForm';
import { Button, Card, Space, Alert } from 'antd';

interface EditFormManagerProps {
  formType: 'dataset' | 'collection';
  gitRef: string;
  filePath: string;
  fileSha: string;
  formData: Record<string, unknown>;
  setFormData: any;
  setStatus: (status: Status) => void;
  setApiErrorMessage: (apiErrorMessage: string) => void;
  handleCancel: () => void;
}

const EditFormManager: React.FC<EditFormManagerProps> = ({
  formType,
  gitRef,
  filePath,
  fileSha,
  formData,
  setFormData,
  setStatus,
  handleCancel,
  setApiErrorMessage,
}) => {
  const [disabled, setDisabled] = useState(true);

  const onFormDataSubmit = (formData?: Record<string, unknown>) => {
    if (!formData) {
      console.error('No form data provided.');
      return;
    }

    setStatus('loadingGithub');

    const url = 'api/create-ingest';
    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ gitRef, fileSha, filePath, formData }),
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
        setFormData({});
        setStatus('success');
      })
      .catch((error) => {
        console.error(error);
        setApiErrorMessage('A network error occurred. Please try again.');
        setStatus('error');
      });
  };

  const childFormProps = {
    formData,
    setFormData,
    onSubmit: onFormDataSubmit,
    setDisabled: setDisabled,
    isEditMode: true,
  };

  const formButtons = (
    <Space
      style={{ display: 'flex', justifyContent: 'center', paddingTop: '24px' }}
    >
      <Button type="primary" size="large" htmlType="submit" disabled={disabled}>
        Submit
      </Button>
      <Button size="large" onClick={handleCancel} danger>
        Cancel
      </Button>
    </Space>
  );

  return (
    <Card>
      {formType === 'dataset' ? (
        <DatasetIngestionForm
          {...childFormProps}
          disableCollectionNameChange={true}
        >
          {formButtons}
        </DatasetIngestionForm>
      ) : formType === 'collection' ? (
        <CollectionIngestionForm {...childFormProps}>
          {formButtons}
        </CollectionIngestionForm>
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

export default EditFormManager;
