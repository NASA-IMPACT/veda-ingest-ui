'use client';

import '@ant-design/v5-patch-for-react-19';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Button,
  Col,
  Row,
  Tabs,
  Card,
  Input,
  Typography,
  message,
  Form as AntdForm,
  Alert,
  Space,
  Tag,
  Divider,
} from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import { useStacExtensions } from '@/hooks/useStacExtensions';
import ExtensionManager from '@/components/ExtensionManager';
import ObjectFieldTemplate from '@/utils/ObjectFieldTemplate';
import { customValidate } from '@/utils/CustomValidation';
import JSONEditor from '@/components/JSONEditor';
import { JSONEditorValue } from '@/components/JSONEditor';
import AdditionalPropertyCard from '@/components/AdditionalPropertyCard';
import BboxField from '@/utils/BboxField';
import IntervalField from '@/utils/IntervalField';
import AssetField from '@/utils/AssetsField';
import CodeEditorWidget from '@/components/CodeEditorWidget';
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
  isEditMode?: boolean;
  children?: React.ReactNode;
}

function CollectionIngestionForm({
  formData,
  setFormData,
  onSubmit,
  isEditMode,
  children,
}: FormProps) {
  const [activeTab, setActiveTab] = useState<string>('form');
  const [forceRenderKey, setForceRenderKey] = useState<number>(0);
  const [hasJSONChanges, setHasJSONChanges] = useState<boolean>(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { extensionFields, addExtension, removeExtension, isLoading } =
    useStacExtensions({ setFormData });

  const prevFormDataRef = useRef(formData);
  useEffect(() => {
    const wasCleared =
      prevFormDataRef.current &&
      Object.keys(prevFormDataRef.current).length > 0 &&
      (!formData || Object.keys(formData).length === 0);
    if (wasCleared) {
      Object.keys(extensionFields).forEach((url) => removeExtension(url));
    }
    prevFormDataRef.current = formData;
  }, [formData, extensionFields, removeExtension]);

  useEffect(() => {
    if (validationErrors.length > 0) {
      const timer = setTimeout(() => setValidationErrors([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [validationErrors]);

  const handleExtensionValueChange = (
    propKey: string,
    isRequired: boolean,
    newValue: string
  ) => {
    try {
      if (newValue.trim() === '""' && !isRequired) {
        setFormData((prev) => {
          const newFormData = { ...prev };
          delete newFormData[propKey];
          return newFormData;
        });
        return;
      }
      const parsedValue = JSON.parse(newValue);
      if (parsedValue === '' && !isRequired) {
        setFormData((prev) => {
          const newFormData = { ...prev };
          delete newFormData[propKey];
          return newFormData;
        });
        return;
      }
      setFormData((prev) => ({ ...prev, [propKey]: parsedValue }));
    } catch (e) {
      setFormData((prev) => ({ ...prev, [propKey]: newValue }));
    }
  };

  const validateExtensionFields = (): boolean => {
    const errors: string[] = [];
    Object.values(extensionFields).forEach(({ fields }) => {
      fields.forEach(({ name, required }) => {
        const value = formData?.[name];
        if (
          required &&
          (value === undefined || value === '' || value === '""')
        ) {
          errors.push(`Field '${name}' is required and cannot be empty.`);
        }
      });
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const { rjsfFormData, additionalProperties } = useMemo(() => {
    const baseKeys = new Set(Object.keys(fullJsonSchema.properties || {}));
    baseKeys.add('stac_extensions');

    const currentExtensionKeys = new Set<string>();
    Object.values(extensionFields).forEach(({ fields }) => {
      fields.forEach(({ name }) => currentExtensionKeys.add(name));
    });

    const rjsfData: Record<string, unknown> = {};
    const additional: Record<string, unknown> = {};

    if (formData) {
      for (const key in formData) {
        if (baseKeys.has(key)) {
          rjsfData[key] = formData[key];
        } else if (key !== 'summaries' && !currentExtensionKeys.has(key)) {
          additional[key] = formData[key];
        }
      }
    }
    return { rjsfFormData: rjsfData, additionalProperties: additional };
  }, [formData, extensionFields]);

  const [summariesData, setSummariesData] = useState(
    rjsfFormData.summaries || {}
  );

  const schemaForRJSF = useMemo(() => {
    const newSchema = JSON.parse(JSON.stringify(fullJsonSchema));
    if (newSchema.properties?.summaries) {
      delete newSchema.properties.summaries;
    }
    return newSchema;
  }, []);

  const onRJSFDataChanged = (formState: { formData?: object }) => {
    const updatedRjsfData =
      (formState.formData as Record<string, unknown>) ?? {};
    setFormData((prev) => ({ ...prev, ...updatedRjsfData }));
  };

  const handleSummariesChange = (newSummaries: Record<string, unknown>) => {
    setSummariesData(newSummaries);
    setFormData((prev) => ({ ...prev, summaries: newSummaries }));
  };

  const handleFormSubmit = () => {
    if (!validateExtensionFields()) {
      return;
    }
    onSubmit({ ...formData, summaries: summariesData });
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
    <>
      <ExtensionManager
        extensionFields={extensionFields}
        onAddExtension={addExtension}
        onRemoveExtension={removeExtension}
        isLoading={isLoading}
      />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'form',
            label: 'Form',
            children: (
              <AntdForm onFinish={handleFormSubmit}>
                <Form
                  key={forceRenderKey}
                  schema={schemaForRJSF as JSONSchema7}
                  uiSchema={isEditMode ? lockedUiSchema : uiSchema}
                  validator={validator}
                  customValidate={customValidate}
                  templates={{ ObjectFieldTemplate }}
                  fields={customFields}
                  formData={rjsfFormData}
                  onChange={onRJSFDataChanged}
                  tagName="div"
                >
                  <></>
                </Form>

                <SummariesManager
                  initialData={summariesData as Record<string, unknown>}
                  onChange={handleSummariesChange}
                />

                {Object.values(extensionFields).map(({ title, fields }) => (
                  <Card
                    key={title}
                    title={`${title} Fields`}
                    style={{ marginTop: '20px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {fields.map(({ name, required }) => (
                        <AntdForm.Item
                          key={name}
                          label={name}
                          required={required}
                        >
                          <CodeEditorWidget
                            value={JSON.stringify(
                              formData?.[name] ?? undefined,
                              null,
                              2
                            )}
                            onChange={(newValue) =>
                              handleExtensionValueChange(
                                name,
                                required,
                                newValue
                              )
                            }
                          />
                        </AntdForm.Item>
                      ))}
                    </Space>
                  </Card>
                ))}

                {Object.keys(additionalProperties).length > 0 && (
                  <AdditionalPropertyCard
                    additionalProperties={additionalProperties}
                    style="warning"
                  />
                )}

                {validationErrors.length > 0 && (
                  <Alert
                    message="Validation Errors"
                    description={
                      <ul>
                        {validationErrors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    }
                    type="error"
                    showIcon
                    style={{ marginTop: '20px' }}
                  />
                )}

                {children ?? (
                  <Row justify="center" style={{ marginTop: '40px' }}>
                    <Col span={24}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                      >
                        Submit
                      </Button>
                    </Col>
                  </Row>
                )}
              </AntdForm>
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
                disableIdChange={isEditMode}
                hasJSONChanges={hasJSONChanges}
                setHasJSONChanges={setHasJSONChanges}
                setAdditionalProperties={() => {}}
                additionalProperties={additionalProperties}
              />
            ),
          },
        ]}
      />
    </>
  );
}

export default CollectionIngestionForm;
