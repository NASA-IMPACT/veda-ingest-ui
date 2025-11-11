'use client';

import React, { useState, useEffect } from 'react';
import { Status } from '@/types/global';
import DatasetIngestionForm from '@/components/ingestion/DatasetIngestionForm';
import CollectionIngestionForm from '@/components/ingestion/CollectionIngestionForm';
import { Button, Card, Space, Alert, Modal, Spin } from 'antd';
import { useCogValidation } from '@/hooks/useCogValidation';
import { VirtualDiffViewer } from 'virtual-react-json-diff';

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
  const [isDiffModalVisible, setIsDiffModalVisible] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<Record<
    string,
    unknown
  > | null>(null);

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

    setPendingFormData(formData);
    setIsDiffModalVisible(true);
  };

  const handleDiffModalConfirm = async () => {
    setIsDiffModalVisible(false);

    if (!pendingFormData) {
      console.error('No pending form data.');
      return;
    }

    // Proceed to COG validation
    const isValid = await validateFormDataCog(pendingFormData, formType);
    if (!isValid) {
      showCogValidationModal();
      return;
    }

    // If COG validation passes, submit immediately
    submitFormData(pendingFormData);
  };

  const handleDiffModalCancel = () => {
    setIsDiffModalVisible(false);
    setPendingFormData(null);
  };

  const submitFormData = (formData: Record<string, unknown>) => {
    setStatus('loadingGithub');

    // Sanitize the form data to ensure STAC schema compliance
    const sanitizeFormData = (data: any): any => {
      if (Array.isArray(data)) {
        return data.map(sanitizeFormData);
      } else if (data && typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
          // Convert null values to empty arrays for fields that should be arrays
          if (value === null && shouldBeArray(key)) {
            sanitized[key] = [];
          }
          // Convert null values to empty objects for fields that should be objects
          else if (value === null && shouldBeObject(key)) {
            sanitized[key] = {};
          } else {
            sanitized[key] = sanitizeFormData(value);
          }
        }
        return sanitized;
      } else if (typeof data === 'string') {
        // Fix datetime format issues for existing data that wasn't processed by IntervalField
        return sanitizeDatetime(data);
      }
      return data;
    };

    // Fix datetime format to comply with STAC schema
    const sanitizeDatetime = (dateStr: string): string => {
      // Fix timezone format: +00 -> +00:00 and ensure T separator
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}\+00$/)) {
        return dateStr.replace(' ', 'T').replace('+00', '+00:00');
      }
      // Ensure T separator for datetime strings
      if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        return dateStr.replace(' ', 'T');
      }
      return dateStr;
    };

    // Define which fields should be arrays when they're null
    const shouldBeArray = (fieldName: string): boolean => {
      const arrayFields = ['stac_extensions', 'keywords', 'providers', 'links'];
      return arrayFields.includes(fieldName);
    };

    // Define which fields should be objects when they're null
    const shouldBeObject = (fieldName: string): boolean => {
      const objectFields = ['assets', 'item_assets', 'summaries'];
      return objectFields.includes(fieldName);
    };

    const sanitizedFormData = sanitizeFormData(formData);

    let url = 'api/create-ingest';
    let requestOptions: RequestInit;

    if (formType === 'existingCollection') {
      const collectionId = sanitizedFormData.id as string;
      if (!collectionId) {
        console.error(
          'Collection ID is required for existing collection updates'
        );
        setApiErrorMessage('Collection ID is missing');
        setStatus('error');
        return;
      }
      url = `/api/existing-collection/${encodeURIComponent(collectionId)}`;
      requestOptions = {
        method: 'PUT',
        body: JSON.stringify(sanitizedFormData),
        headers: { 'Content-Type': 'application/json' },
      };
    } else {
      requestOptions = {
        method: 'PUT',
        body: JSON.stringify({
          gitRef,
          fileSha,
          filePath,
          formData: sanitizedFormData,
        }),
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
    if (pendingFormData) {
      submitFormData(pendingFormData);
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
        title="Review Changes"
        open={isDiffModalVisible}
        onOk={handleDiffModalConfirm}
        onCancel={handleDiffModalCancel}
        okText="Confirm Changes"
        cancelText="Cancel"
        width={1200}
        destroyOnHidden={true}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Review the changes below before submitting"
            type="info"
            showIcon
          />
        </div>
        {pendingFormData && (
          <VirtualDiffViewer
            oldValue={originalFormData}
            newValue={pendingFormData}
            height={500}
            showLineCount={true}
            showObjectCountStats={false}
            differOptions={{ showModifications: true }}
          />
        )}
      </Modal>

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
