'use client';

import '@ant-design/v5-patch-for-react-19';

import { SetStateAction, useEffect, useState } from 'react';
import { Card, Tabs } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/jsonschema.json';
import { UiSchema } from '@rjsf/utils';
import { customValidate } from '@/utils/CustomValidation';
import { handleSubmit } from '@/utils/FormHandlers';
import JSONEditor from '@/components/JSONEditor';
import { JSONEditorValue } from '@/components/JSONEditor';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import CodeEditorWidget from './CodeEditorWidget';

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
  disableCollectionNameChange?: boolean;
}

function IngestForm({
  formData,
  setFormData,
  uiSchema,
  onSubmit,
  setDisabled,
  children,
  disableCollectionNameChange = false,
  defaultTemporalExtent = false,
}: FormProps) {
  const [activeTab, setActiveTab] = useState<string>('form');
  const [forceRenderKey, setForceRenderKey] = useState<number>(0); // Force refresh RJSF to clear validation errors
  const [hasJSONChanges, setHasJSONChanges] = useState<boolean>(false);
  const [additionalProperties, setAdditionalProperties] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    if (defaultTemporalExtent) {
      setFormData((prevFormData: FormData | undefined) => {
        const now = new Date();

        // Start of the current UTC day
        const startOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0,
            0,
            0
          )
        ).toISOString();

        // End of the current UTC day
        const endOfDay = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59
          )
        ).toISOString();

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
    setFormData((formState.formData as Record<string, unknown>) ?? {});
    if (setDisabled) {
      setDisabled(false);
    }
  };

  const handleJsonEditorChange = (updatedData: JSONEditorValue) => {
    setFormData(updatedData);
    setForceRenderKey((prev) => prev + 1); // Forces RJSF to re-render and re-validate
    setActiveTab('form');
    setHasJSONChanges(false);
  };

  const updateFormData = (updatedData: SetStateAction<object | undefined>) => {
    setFormData((updatedData ?? {}) as Record<string, unknown>);
    setForceRenderKey((prev) => prev + 1); // Forces RJSF to re-render and re-validate
  };

  const widgets = {
    'renders.dashboard': CodeEditorWidget, // Map the nested field
  };

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        {
          key: 'form',
          label: 'Form',
          children: (
            <>
              <Form
                key={forceRenderKey} // Forces re-render when data updates
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
                formContext={{ formData, updateFormData: setFormData }}
                widgets={widgets}
              >
                {children}
              </Form>
              {additionalProperties && additionalProperties.length > 0 && (
                <AdditionalPropertyCard
                  additionalProperties={additionalProperties}
                  style="warning"
                />
              )}
            </>
          ),
        },
        {
          key: 'json',
          label: 'Manual JSON Edit',
          children: (
            <JSONEditor
              value={formData || {}}
              onChange={handleJsonEditorChange}
              disableCollectionNameChange={disableCollectionNameChange}
              hasJSONChanges={hasJSONChanges}
              setHasJSONChanges={setHasJSONChanges}
              additionalProperties={additionalProperties}
              setAdditionalProperties={setAdditionalProperties}
            />
          ),
        },
      ]}
    />
  );
}

export default IngestForm;
