import { SetStateAction, useState } from 'react';

import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/ObjectFieldTemplate';
import jsonSchema from '@/formSchemas/jsonschema.json';
import uiSchema from '@/formSchemas/uischema.json';
import { Status } from '@/vite-env';

const Form = withTheme(AntDTheme);

function ValidationForm({
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
  const [formData, setFormData] = useState<unknown>({});

  const onFormDataChanged = (formState: {
    formData: SetStateAction<object | undefined>;
  }) => {
    setFormData(formState.formData);
  };

  // @ts-expect-error RJSF form data typing
  const onFormDataSubmit = async ({ formData }) => {
    setStatus('loading');
    setCollectionName(formData.collection);
    console.log(formData);
    const url = 'api/ingest';
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

      const data = await response.json();
      setPullRequestUrl(data['data']);
      setFormData({});
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <Form
      schema={jsonSchema as JSONSchema7}
      uiSchema={uiSchema}
      validator={validator}
      templates={{
        ObjectFieldTemplate: ObjectFieldTemplate,
      }}
      formData={formData}
      // @ts-expect-error RJSF onChange typing
      onChange={onFormDataChanged}
      // @ts-expect-error RJSF onSubmit typing
      onSubmit={onFormDataSubmit}
    />
  );
}

export default ValidationForm;
