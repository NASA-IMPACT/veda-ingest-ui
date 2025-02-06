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
  setApiErrorMessage
}: {
  setStatus: (status: Status) => void;
  ref: string;
  filePath: string;
  fileSha: string;
  formData: Record<string, unknown>;
  setFormData: any;
  handleCancel: () => void;
  setApiErrorMessage: (apiErrorMessage: string) => void;
}) {
  const [disabled, setDisabled] = useState(true);

  const onFormDataSubmit = (formData?: Record<string, unknown>) => {
    console.log('updating data: ', formData)

    if (!formData) {
      console.error("No form data provided.");
      return;
    }
  
    setStatus("loadingGithub");


  
    const url = "api/create-ingest";
    const requestOptions = {
      method: "PUT",
      body: JSON.stringify({ref, fileSha, filePath, formData }),
      headers: { "Content-Type": "application/json" },
    };
  
    fetch(url, requestOptions)
      .then(async (response) => {
        if (!response.ok) {
          const errorMessage = await response.text();
          setApiErrorMessage(errorMessage);
          setStatus("error"); new Error(`There was an error: ${errorMessage}`);
        }
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
      uiSchema={lockedUiSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onFormDataSubmit}
      setDisabled={setDisabled}
      disableCollectionNameChange={true}
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
