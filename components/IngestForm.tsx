'use client';

import { SetStateAction, useEffect } from 'react';

import { IChangeEvent, withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import { UiSchema } from '@rjsf/utils';
import { customValidate } from '@/utils/FormValidation';
import { handleSubmit } from "@/utils/FormHandlers";

const Form = withTheme(AntDTheme);

interface TemporalExtent {
  startdate?: string;
  enddate?: string;
}

interface FormData {
  temporal_extent?: TemporalExtent;
}

interface FormProps {
  formData: Record<string, unknown> | undefined;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  uiSchema: UiSchema;
  onSubmit: (formData: Record<string, unknown> | undefined) => void;
  setDisabled?: (disabled: boolean) => void;
  children?: React.ReactNode;
  defaultTemporalExtent?: boolean;
}

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
  setDisabled,
  children,
  defaultTemporalExtent = false,
}: FormProps) {

  useEffect(() => {
    if (defaultTemporalExtent) {
      setFormData((prevFormData: FormData | undefined) => {
        const now = new Date();
      
        // Start of the current UTC day
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
          .toISOString();
        
        // End of the current UTC day
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59))
          .toISOString();
  
        console.log('startOfDay', startOfDay)
        return {
          ...prevFormData,
          temporal_extent: {
            startdate: prevFormData?.temporal_extent?.startdate || startOfDay,
            enddate: prevFormData?.temporal_extent?.enddate || endOfDay,
          },
        };
      });
    }
  }, [defaultTemporalExtent, setFormData]);
  
  const onFormDataChanged = (formState: { formData?: object }) => {
    setFormData(formState.formData as Record<string, unknown> ?? {});

    if (setDisabled) {
      setDisabled(false);
    }
  };
  

  const updateFormData = (updatedData: SetStateAction<object | undefined>) => {
    setFormData((updatedData ?? {}) as Record<string, unknown>);
  };

  return (
    <Form
      schema={jsonSchema as JSONSchema7}
      uiSchema={uiSchema}
      validator={validator}
      customValidate={customValidate}
      templates={{
        ObjectFieldTemplate: ObjectFieldTemplate,
      }}
      formData={formData}
      onChange={onFormDataChanged}
      onSubmit={(data) => handleSubmit(data, onSubmit)}
      formContext={{ updateFormData }}
    >
      {children}
    </Form>
  );
}

export default IngestForm;
