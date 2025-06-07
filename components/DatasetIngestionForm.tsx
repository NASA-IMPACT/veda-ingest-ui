'use client';

import '@ant-design/v5-patch-for-react-19';

import { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import jsonSchema from '@/FormSchemas/datasets/datasetSchema.json';
import { customValidate } from '@/utils/CustomValidation';
import { handleSubmit } from '@/utils/FormHandlers';
import JSONEditor from '@/components/JSONEditor';
import { JSONEditorValue } from '@/components/JSONEditor';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import CodeEditorWidget from './CodeEditorWidget';
import uiSchema from '@/FormSchemas/datasets/uischema.json';

const Form = withTheme(AntDTheme);

interface TemporalExtent {
  startdate?: string;
  enddate?: string;
}

interface FormData {
  temporal_extent?: TemporalExtent;
}

const lockedFormFields = {
  collection: {
    'ui:readonly': true,
  },
};

const lockedUiSchema = { ...uiSchema, ...lockedFormFields };

interface FormProps {
  formData: Record<string, unknown> | undefined;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onSubmit: (formData: Record<string, unknown> | undefined) => void;
  setDisabled?: (disabled: boolean) => void;
  isEditMode?: boolean;
  children?: React.ReactNode;
  defaultTemporalExtent?: boolean;
  disableCollectionNameChange?: boolean;
}

function DatasetIngestionForm({
  formData,
  setFormData,
  onSubmit,
  setDisabled,
  isEditMode,
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

  const widgets = {
    'renders.dashboard': CodeEditorWidget,
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
                uiSchema={isEditMode ? lockedUiSchema : uiSchema}
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
              jsonSchema={jsonSchema}
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

export default DatasetIngestionForm;
