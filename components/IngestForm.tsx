'use client';

import { FormEvent, SetStateAction } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '../ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import { RJSFSchema, UiSchema } from '@rjsf/utils';

const Form = withTheme(AntDTheme);

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
}: {
  formData: Record<string, unknown>;
  setFormData: unknown;
  uiSchema: UiSchema<any, RJSFSchema, any> | undefined;
  onSubmit: (
    data: IChangeEvent<any, RJSFSchema, any>,
    event: FormEvent<any>
  ) => void;
}) {
  const onFormDataChanged = (formState: {
    formData: SetStateAction<object | undefined>;
  }) => {
    // @ts-expect-error something
    setFormData(formState.formData);
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
    />
  );
}

export default IngestForm;
