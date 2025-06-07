'use client';

import '@ant-design/v5-patch-for-react-19';

import { SetStateAction, useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import { customValidate } from '@/utils/CustomValidation';
import { handleSubmit } from '@/utils/FormHandlers';
import JSONEditor from '@/components/JSONEditor';
import { JSONEditorValue } from '@/components/JSONEditor';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import jsonSchema from '@/FormSchemas/collections/collectionSchema.json';
import uiSchema from '@/FormSchemas/collections/uischema.json';

const Form = withTheme(AntDTheme);

interface FormProps {
  formData: Record<string, unknown> | undefined;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onSubmit: (formData: Record<string, unknown> | undefined) => void;
  setDisabled?: (disabled: boolean) => void;
  children?: React.ReactNode;
}

function DatasetIngestionForm({
  formData,
  setFormData,
  onSubmit,
  setDisabled,
  children,
}: FormProps) {
  const [activeTab, setActiveTab] = useState<string>('form');
  const [forceRenderKey, setForceRenderKey] = useState<number>(0); // Force refresh RJSF to clear validation errors
  const [hasJSONChanges, setHasJSONChanges] = useState<boolean>(false);
  const [additionalProperties, setAdditionalProperties] = useState<
    string[] | null
  >(null);

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
