'use client';

import '@ant-design/v5-patch-for-react-19';

import { useState, useMemo } from 'react';
import { Button, Col, Row, Tabs } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import { customValidate } from '@/utils/CustomValidation';
import JSONEditor from '@/components/JSONEditor';
import { JSONEditorValue } from '@/components/JSONEditor';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import BboxField from '@/utils/BboxField';
import IntervalField from '@/utils/IntervalField';
import AssetField from '@/utils/AssetsField';

import SummariesManager from '@/components/SummariesManager';

import fullJsonSchema from '@/FormSchemas/collections/collectionSchema.json';
import uiSchema from '@/FormSchemas/collections/uischema.json';

const Form = withTheme(AntDTheme);

const customFields = {
  BboxField: BboxField,
  interval: IntervalField,
  asset: AssetField,
};

const lockedFormFields = {
  id: {
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
}

function DatasetIngestionForm({
  formData,
  setFormData,
  onSubmit,
  setDisabled,
  isEditMode,
  children,
}: FormProps) {
  const [activeTab, setActiveTab] = useState<string>('form');
  const [forceRenderKey, setForceRenderKey] = useState<number>(0);
  const [hasJSONChanges, setHasJSONChanges] = useState<boolean>(false);
  const [additionalProperties, setAdditionalProperties] = useState<
    string[] | null
  >(null);

  // Separate the summaries data from the rest of the form data
  const { summaries: initialSummaries, ...rjsfFormData } = formData || {};

  const [summariesData, setSummariesData] = useState(initialSummaries || {});

  // This schema is passed to RJSF and has 'summaries' removed to prevent conflicts
  const schemaForRJSF = useMemo(() => {
    const newSchema = JSON.parse(JSON.stringify(fullJsonSchema));
    if (newSchema.properties && newSchema.properties.summaries) {
      delete newSchema.properties.summaries;
    }
    return newSchema;
  }, []);

  const onRJSFDataChanged = (formState: { formData?: object }) => {
    // This only updates the RJSF portion of the data
    const updatedRjsfData =
      (formState.formData as Record<string, unknown>) ?? {};
    setFormData({ ...updatedRjsfData, summaries: summariesData }); // Keep summaries data in sync
    if (setDisabled) setDisabled(false);
  };

  const handleSummariesChange = (newSummaries: Record<string, unknown>) => {
    setSummariesData(newSummaries);
    // Combine with the rest of the form data when summaries change
    setFormData({ ...rjsfFormData, summaries: newSummaries });
    if (setDisabled) setDisabled(false);
  };

  const handleSubmit = (rjsfData: { formData?: object }) => {
    // On final submit, combine the data from RJSF with the data from our manager
    const finalFormData = {
      ...(rjsfData.formData || {}),
      summaries: summariesData,
    };
    onSubmit(finalFormData);
  };

  const handleJsonEditorChange = (updatedData: JSONEditorValue) => {
    setFormData(updatedData);
    // When JSON is edited, also update the separated summaries state
    setSummariesData(updatedData.summaries || {});
    setForceRenderKey((prev) => prev + 1);
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
                key={forceRenderKey}
                schema={schemaForRJSF as JSONSchema7} // Use the schema WITHOUT summaries
                uiSchema={isEditMode ? lockedUiSchema : uiSchema}
                validator={validator}
                customValidate={customValidate}
                templates={{ ObjectFieldTemplate: ObjectFieldTemplate }}
                fields={customFields}
                formData={rjsfFormData} // Pass only the non-summaries data
                onChange={onRJSFDataChanged}
                onSubmit={handleSubmit}
                formContext={{ formData, updateFormData: setFormData }}
              >
                <div style={{ marginTop: '-24px' }}>
                  <SummariesManager
                    initialData={summariesData}
                    onChange={handleSummariesChange}
                  />
                </div>
                {children}
                <Row justify="center" style={{ marginTop: '40px' }}>
                  <Col span={24}>
                    <Button type="primary" htmlType="submit" size="large" block>
                      Submit
                    </Button>
                  </Col>
                </Row>
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
              jsonSchema={fullJsonSchema}
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
