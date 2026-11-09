'use client';

import '@ant-design/v5-patch-for-react-19';
import { ElementType } from 'react';
import { Alert, Card, Form as AntdForm, Space } from 'antd';
import { Form } from '../rjsfTheme';
import { JSONSchema7 } from 'json-schema';
import type {
  UiSchema as RJSFUiSchema,
  RegistryWidgetsType,
  RegistryFieldsType,
  UiSchema,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { customValidate } from '@/utils/CustomValidation';
import ObjectFieldTemplate from '@/components/rjsf-components/ObjectFieldTemplate';
import SummariesManager from '@/components/rjsf-components/SummariesManager';
import { Extension } from '@/hooks/useStacExtensions';
import CodeEditorWidget from '@/components/ui/CodeEditorWidget';
import AdditionalPropertyCard from '@/components/rjsf-components/AdditionalPropertyCard';

interface ManualFormProps {
  customFields: RegistryFieldsType;
  onRJSFDataChanged: (formState: { formData?: object | undefined }) => void;
  rjsfFormData?: Record<string, unknown>;
  widgets: RegistryWidgetsType;
  forceRenderKey?: number;
  schemaForRJSF: JSONSchema7;
  uiSchema: RJSFUiSchema | UiSchema;
  summariesData?: Record<string, unknown>;
  handleSummariesChange?: (newSummaries: Record<string, unknown>) => void;
  isExistingCollectionEditMode?: boolean;
  extensionFields?: Record<string, Extension>;
  handleExtensionValueChange?: (
    propKey: string,
    isRequired: boolean,
    newValue: string
  ) => void;
  formData?: Record<string, unknown> | undefined;
  additionalProperties?: Record<string, unknown>;
  validationErrors?: string[];
  children?: React.ReactNode;
  formContext?: Record<string, unknown>;
  tagName?: ElementType;
}

export function AntdManualForm({
  handleFormSubmit,
  children,
}: {
  handleFormSubmit: () => void;
  children: React.ReactNode;
}) {
  return <AntdForm onFinish={handleFormSubmit}>{children}</AntdForm>;
}

export function ManualForm({
  customFields,
  onRJSFDataChanged,
  rjsfFormData,
  widgets,
  forceRenderKey,
  schemaForRJSF,
  uiSchema,
  summariesData,
  handleSummariesChange,
  isExistingCollectionEditMode,
  extensionFields,
  handleExtensionValueChange,
  formData,
  additionalProperties,
  validationErrors,
  children,
  formContext,
  tagName,
}: ManualFormProps) {
  return (
    <>
      <Form
        key={forceRenderKey}
        schema={schemaForRJSF as JSONSchema7}
        uiSchema={uiSchema}
        validator={validator}
        customValidate={customValidate}
        templates={{ ObjectFieldTemplate }}
        fields={customFields}
        formData={rjsfFormData}
        onChange={onRJSFDataChanged}
        widgets={widgets}
        tagName={tagName}
        formContext={formContext}
      >
        <></>
      </Form>
      {handleSummariesChange && (
        <SummariesManager
          initialData={summariesData}
          onChange={handleSummariesChange}
          readonly={isExistingCollectionEditMode}
        />
      )}

      {extensionFields &&
        handleExtensionValueChange &&
        Object.values(extensionFields).map(({ title, fields }) => (
          <Card
            key={title}
            title={`${title} Fields`}
            style={{ marginTop: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map(({ name, required }) => {
                const fieldId = name;

                return (
                  <AntdForm.Item
                    key={name}
                    label={name}
                    required={required}
                    htmlFor={fieldId}
                  >
                    <CodeEditorWidget
                      id={fieldId}
                      value={JSON.stringify(
                        formData?.[name] ?? undefined,
                        null,
                        2
                      )}
                      onChange={(newValue) =>
                        handleExtensionValueChange(name, required, newValue)
                      }
                    />
                  </AntdForm.Item>
                );
              })}
            </Space>
          </Card>
        ))}

      {additionalProperties && Object.keys(additionalProperties).length > 0 && (
        <AdditionalPropertyCard
          additionalProperties={additionalProperties}
          style="warning"
        />
      )}

      {validationErrors && validationErrors.length > 0 && (
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
      {children}
    </>
  );
}
