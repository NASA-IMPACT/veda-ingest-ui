'use client';

import { FormEvent, SetStateAction } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import { RJSFSchema, UiSchema } from '@rjsf/utils';

const Form = withTheme(AntDTheme);

type FormProps = {
  formData: Record<string, unknown>;
  setFormData: unknown;
  uiSchema: UiSchema<any, RJSFSchema, any> | undefined;
  onSubmit: (
    data: IChangeEvent<any, RJSFSchema, any>,
    event: FormEvent<any>
  ) => void;
  children?: React.ReactNode;
  setDisabled?: (disabled: boolean) => void;
};

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
  setDisabled,
  children,
}: FormProps) {
  
  const onFormDataChanged = (formState: {
    formData: SetStateAction<object | undefined>;
  }) => {
    // @ts-expect-error something
    setFormData(formState.formData);
    if(setDisabled) {
      setDisabled(false);
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
      onSubmit={onSubmit}
    >
      {children}
    </Form>
  );
}

export default IngestForm;
