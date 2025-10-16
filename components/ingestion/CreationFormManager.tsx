'use client';

import React, { useState } from 'react';
import { Card, Typography, Alert, Modal, Input, Spin } from 'antd';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/ingestion/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/ingestion/CollectionIngestionForm';
import { useCogValidation } from '@/hooks/useCogValidation';

const { Title } = Typography;
const { TextArea } = Input;

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userComment, setUserComment] = useState('');
  const [stagedFormData, setStagedFormData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const {
    isCogValidationModalVisible,
    isValidatingCog,
    showCogValidationModal,
    hideCogValidationModal,
    validateFormDataCog,
  } = useCogValidation();

  const handleFormSubmit = async (data?: Record<string, unknown>) => {
    if (!data) {
      console.error('No form data provided.');
      return;
    }

    // Clean up the form data
    const cleanedData = { ...data };
    if (Array.isArray(cleanedData.tenant) && cleanedData.tenant.length === 0) {
      delete cleanedData.tenant;
    }

    setStagedFormData(cleanedData);

    const isValid = await validateFormDataCog(cleanedData, formType);
    if (!isValid) {
      showCogValidationModal();
      return;
    }

    setIsModalVisible(true);
  };

  const handleCogValidationContinue = () => {
    hideCogValidationModal();
    setIsModalVisible(true);
  };

  const handleFinalSubmit = () => {
    if (!stagedFormData) {
      console.error('No staged form data available for submission.');
      setIsModalVisible(false);
      return;
    }

    setIsModalVisible(false);
    setStatus('loadingGithub');
    setCollectionName(stagedFormData.collection as string);

    const url = 'api/create-ingest';
    const payload = {
      data: stagedFormData,
      ingestionType: formType,
      userComment: userComment,
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
      })
      .finally(() => {
        setStagedFormData(null);
        setUserComment('');
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setStagedFormData(null);
    setUserComment('');
  };

  const handleCogValidationCancel = () => {
    hideCogValidationModal();
    setStagedFormData(null);
  };

  const childFormProps = {
    formData,
    setFormData,
    onSubmit: handleFormSubmit,
    isEditMode: false,
  };

  const title = `Create New ${formType.charAt(0).toUpperCase() + formType.slice(1)}`;

  return (
    <>
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

      <Modal
        title="Add an Optional Note for Maintainers"
        open={isModalVisible}
        onOk={handleFinalSubmit}
        onCancel={handleCancel}
        okText="Continue & Submit"
        cancelText="Cancel"
        destroyOnHidden={true}
      >
        <p style={{ marginBottom: 8 }}>
          You can add additional information for the Data Services Team to help
          with this ingest. This message is optional.
        </p>
        <TextArea
          rows={4}
          value={userComment}
          onChange={(e) => setUserComment(e.target.value)}
          placeholder="e.g., This is a new data type."
          data-testid="user-comment-textarea"
        />
      </Modal>

      {isValidatingCog && <Spin fullscreen />}
    </>
  );
};

export default CreationFormManager;
