'use client';

import { FormEvent, SetStateAction, useEffect, useState } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '../ObjectFieldTemplate';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import $RefParser from "@apidevtools/json-schema-ref-parser";

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
};

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
  children,
}: FormProps) {
  const [schema, setSchema] = useState({});

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const parser = new $RefParser();
        const dereferencedSchema = await parser.dereference('/FormSchemas/jsonschema.json');
        console.log('dereferencedSchema', dereferencedSchema)
        setSchema(dereferencedSchema);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSchema();
  }, []);

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
    >
      {children}
    </Form>
  );
}

export default IngestForm;
