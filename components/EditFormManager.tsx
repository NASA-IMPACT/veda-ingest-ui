'use client';

import React, { useState } from 'react';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/CollectionIngestionForm';
import { Button } from 'antd';

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

    const url = 'api/create-dataset';
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
          new Error(`There was an error: ${errorMessage}`);
        }
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
    setDisabled: setDisabled,
    isEditMode: true,
  };

  const formButtons = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
      <Button type="primary" size="large" htmlType="submit" disabled={disabled}>
        Submit
      </Button>
      <Button
        color="danger"
        variant="outlined"
        size="large"
        onClick={handleCancel}
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
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
        <div className="text-red-500 text-center p-4">
          Invalid formType specified. Please use dataset or collection.
        </div>
      )}
    </div>
  );
};

export default EditFormManager;
