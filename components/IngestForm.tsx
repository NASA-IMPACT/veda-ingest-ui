'use client';

import { SetStateAction } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import { RJSFSchema, UiSchema } from '@rjsf/utils';

const Form = withTheme(AntDTheme);

interface FormProps {
  formData: Record<string, unknown> | undefined;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  uiSchema: UiSchema;
  onSubmit: (formData: Record<string, unknown> | undefined) => void;
  setDisabled?: (disabled: boolean) => void;
  children?: React.ReactNode;
}

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
  setDisabled,
  children,
}: FormProps) {
  
  const onFormDataChanged = (formState: { formData?: object }) => {
    setFormData(formState.formData as Record<string, unknown> ?? {});

    if (setDisabled) {
      setDisabled(false);
    }
  };
  

  const updateFormData = (updatedData: SetStateAction<object | undefined>) => {
    setFormData((updatedData ?? {}) as Record<string, unknown>);
  };

  const handleSubmit = (data: IChangeEvent<any, RJSFSchema, any>) => {
    if (onSubmit) {
      onSubmit(data.formData as Record<string, unknown>);
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
      onChange={onFormDataChanged}
      onSubmit={handleSubmit}
      formContext={{ updateFormData }}
    >
      {children}
    </Form>
  );
}

export default IngestForm;
