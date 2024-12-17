'use client';

import { FormEvent, SetStateAction } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '../ObjectFieldTemplate';
import uiSchema from '@/FormSchemas/uischema.json';
import { RJSFSchema } from '@rjsf/utils';

const Form = withTheme(AntDTheme);

function IngestForm({
  formData,
  setFormData,
  schema,
  onSubmit,
}: {
  formData: RJSFSchema,
  setFormData: unknown,
  schema: unknown,
  onSubmit: (data: IChangeEvent<any, RJSFSchema, any>, event: FormEvent<any>) => void,
}) {
  const onFormDataChanged = (formState: {
    formData: SetStateAction<object | undefined>;
  }) => {
    // @ts-expect-error something
    setFormData(formState.formData);
  };

  return (
    <Form
      schema={schema as JSONSchema7}
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
