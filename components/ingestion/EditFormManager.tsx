'use client';

import React, { useState, useEffect } from 'react';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/ingestion/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/ingestion/CollectionIngestionForm';
import { Button, Card, Space, Alert, Modal, Spin } from 'antd';
import { useCogValidation } from '@/hooks/useCogValidation';

interface EditFormManagerProps {
  formType: 'dataset' | 'collection' | 'existingCollection';
  gitRef?: string;
  filePath?: string;
  fileSha?: string;
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
  const [originalFormData, setOriginalFormData] = useState<
    Record<string, unknown>
  >({});

  // When component mounts or formData is initially set, store it as the original state
  useEffect(() => {
    if (
      formData &&
      Object.keys(formData).length > 0 &&
      originalFormData &&
      Object.keys(originalFormData).length === 0
    ) {
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [formData, originalFormData]);

  // Compare current form data with original to determine if there are changes
  useEffect(() => {
    if (
      formData &&
      originalFormData &&
      Object.keys(originalFormData).length > 0
    ) {
      const hasChanges =
        JSON.stringify(formData) !== JSON.stringify(originalFormData);
      setDisabled(!hasChanges);
    }
  }, [formData, originalFormData]);

  const {
    isCogValidationModalVisible,
    isValidatingCog,
    showCogValidationModal,
    hideCogValidationModal,
    validateFormDataCog,
  } = useCogValidation();

  const onFormDataSubmit = async (formData?: Record<string, unknown>) => {
    if (!formData) {
      console.error('No form data provided.');
      return;
    }

    const isValid = await validateFormDataCog(formData, formType);
    if (!isValid) {
      showCogValidationModal();
      return;
    }

    submitFormData(formData);
  };

  const submitFormData = (formData: Record<string, unknown>) => {
    setStatus('loadingGithub');

    let url = 'api/create-ingest';
    let requestOptions: RequestInit;

    if (formType === 'existingCollection') {
      url = '/api/existing-collection';
      requestOptions = {
        method: 'PUT',
        body: JSON.stringify({ formData }),
        headers: { 'Content-Type': 'application/json' },
      };
    } else {
      requestOptions = {
        method: 'PUT',
        body: JSON.stringify({ gitRef, fileSha, filePath, formData }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

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

  const handleCogValidationContinue = () => {
    hideCogValidationModal();
    if (formData) {
      submitFormData(formData);
    }
  };

  const handleCogValidationCancel = () => {
    hideCogValidationModal();
  };

  const childFormProps = {
    formData,
    setFormData,
    onSubmit: onFormDataSubmit,
    setDisabled: (value: boolean) => setDisabled(value),
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
    <>
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
        ) : formType === 'existingCollection' ? (
          <CollectionIngestionForm {...childFormProps}>
            {formButtons}
          </CollectionIngestionForm>
        ) : (
          <Alert
            message="Invalid formType specified. Please use dataset, collection, or existingCollection."
            type="error"
            showIcon
          />
        )}
      </Card>

      <Modal
        title="COG Validation Warning"
        open={isCogValidationModalVisible}
        onOk={handleCogValidationContinue}
        onCancel={handleCogValidationCancel}
        okText="Continue Anyway"
        cancelText="Cancel"
        destroyOnHidden={true}
      >
        <p>
          Sample File COG Validation failed. The COG defined at the sample file
          URL may be invalid or unreachable. Before data is ready for production
          this COG file should be updated.
        </p>
      </Modal>

      {isValidatingCog && <Spin fullscreen />}
    </>
  );
};

export default EditFormManager;
