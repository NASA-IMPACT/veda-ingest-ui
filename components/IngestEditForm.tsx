'use client';

import { Status } from '@/types/global';
import IngestForm from '@/components/IngestForm';
import uiSchema from '@/FormSchemas/uischema.json';
import { Button } from 'antd';

const lockedFormFields = {
  collection: {
    'ui:readonly': true,
  },
  'ui:submitButtonOptions': {
    props: {
      block: 'false',
    },
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
  // @ts-expect-error RJSF form data typing
  const onFormDataSubmit = async ({ formData }) => {
    setStatus('loading');

    const url = 'api/create-ingest';
    console.log(`creating pr in ${ref} with fileSha: ${fileSha}`);
    console.log(formData);
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

      const responseJson = await response.json();
      console.log(responseJson);
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
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Button type="primary" size="large" htmlType="submit">
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
