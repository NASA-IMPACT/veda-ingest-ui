'use client';
import { useState } from 'react';

import IngestForm from '@/components/IngestForm';
import uiSchema from '@/FormSchemas/uischema.json';
import { Button } from 'antd';
import { Status } from '@/types/global';

const lockedFormFields = {
  collection: {
    'ui:readonly': true,
  },
};

const lockedUiSchema = { ...uiSchema, ...lockedFormFields };

function IngestEditForm({
  setStatus,
  ref,
  filePath,
  fileSha,
  formData,
  setFormData,
  handleCancel,
}: {
  setStatus: (status: Status) => void;
  ref: string;
  filePath: string;
  fileSha: string;
  formData: Record<string, unknown>;
  setFormData: any;
  handleCancel: () => void;
}) {
  const [disabled, setDisabled] = useState(true);

  // @ts-expect-error RJSF form data typing
  const onFormDataSubmit = async ({ formData }) => {
    setStatus('loadingGithub');

    const url = 'api/create-ingest';
    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ ref, fileSha, filePath, formData }),
      headers: { 'Content-Type': 'application/json' },
    };
    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorMessage = await response.text();
        setStatus('error');
        throw new Error(`There was an error onSubmit: ${errorMessage}`);
      }

      setFormData({});
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <IngestForm
      uiSchema={lockedUiSchema}
      formData={formData}
      setFormData={setFormData}
      // @ts-expect-error testing
      onSubmit={onFormDataSubmit}
      setDisabled={setDisabled}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          disabled={disabled}
        >
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
    </IngestForm>
  );
}

export default IngestEditForm;
