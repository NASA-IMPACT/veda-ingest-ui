'use client';

import '@ant-design/v5-patch-for-react-19';

import React, {
  useEffect,
  useState,
  FC,
  memo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import { Button, Tabs, Spin } from 'antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { WidgetProps } from '@rjsf/utils';

import ObjectFieldTemplate from '@/components/rjsf-components/ObjectFieldTemplate';
import { customValidate } from '@/utils/CustomValidation';
import { JSONEditorValue } from '@/components/ui/JSONEditor';
import AdditionalPropertyCard from '@/components/rjsf-components/AdditionalPropertyCard';
import CodeEditorWidget from '@/components/ui/CodeEditorWidget';

import staticBaseSchema from '@/FormSchemas/datasets/datasetSchema.json';
import uiSchema from '@/FormSchemas/datasets/uischema.json';
import { TestableUrlWidget } from '@/components/rjsf-components/TestableUrlWidget';

import { useTenants } from '@/hooks/useTenants';
import { Form } from './rjsfTheme';

// Lazy load JSONEditor - only needed when JSON tab is active
const JSONEditor = lazy(() => import('@/components/ui/JSONEditor'));

// --- Adapter Component ---
// This component accepts RJSF's props and translates them to what CodeEditorWidget expects.
const RjsfCodeEditorWidget: FC<WidgetProps> = ({
  value,
  onChange,
  readonly,
}) => {
  // Convert object to JSON string for display in editor
  const stringValue = React.useMemo(() => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    // If it's an object, stringify it with proper formatting
    return JSON.stringify(value, null, 2);
  }, [value]);

  const handleOnChange = (newValue: string) => {
    // Always pass the raw string value to the form state.
    // RJSF will handle validation against the schema.
    onChange(newValue);
  };

  return (
    <CodeEditorWidget
      value={stringValue}
      onChange={handleOnChange}
      readOnly={readonly}
    />
  );
};

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
  const {
    schema: dynamicSchema,
    uiSchema: dynamicUiSchema,
    isLoading: isTenantsLoading,
  } = useTenants(staticBaseSchema as JSONSchema7, uiSchema);

  const [activeTab, setActiveTab] = useState<string>('form');
  const [forceRenderKey, setForceRenderKey] = useState<number>(0);
  const [hasJSONChanges, setHasJSONChanges] = useState<boolean>(false);
  const [additionalProperties, setAdditionalProperties] = useState<{
    [key: string]: any;
  } | null>(null);

  const lockedUiSchema = dynamicUiSchema
    ? { ...dynamicUiSchema, ...lockedFormFields }
    : { ...uiSchema, ...lockedFormFields };

  // --- Set initial "default" data for new forms ---
  useEffect(() => {
    if (!isEditMode && (!formData || Object.keys(formData).length === 0)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        // Manually set "default" values here
        license: 'CC0-1.0',
        stac_version: '1.0.0',
        spatial_extent: {
          xmin: -180,
          ymin: -90,
          xmax: 180,
          ymax: 90,
        },
        stac_extensions: [
          'https://stac-extensions.github.io/render/v1.0.0/schema.json',
          'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
        ],
        item_assets: {
          cog_default: {
            type: 'image/tiff; application=geotiff; profile=cloud-optimized',
            roles: ['data', 'layer'],
            title: 'Default COG Layer',
            description: 'Cloud optimized default layer to display on map',
          },
        },
        providers: [
          {
            name: 'NASA VEDA',
            roles: ['host'],
            url: 'https://www.earthdata.nasa.gov/dashboard/',
          },
        ],
        assets: {
          thumbnail: {
            title: 'Thumbnail',
            type: 'image/jpeg',
            roles: ['thumbnail'],
          },
        },
      }));
    }
  }, [isEditMode, formData, setFormData]);

  useEffect(() => {
    if (defaultTemporalExtent) {
      setFormData((prevFormData: FormData | undefined) => {
        const now = new Date();
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

  const onFormDataChanged = useCallback(
    (formState: { formData?: object }) => {
      setFormData((formState.formData as Record<string, unknown>) ?? {});
      if (setDisabled) {
        setDisabled(false);
      }
    },
    [setFormData, setDisabled]
  );

  const handleJsonEditorChange = useCallback(
    (updatedData: JSONEditorValue) => {
      setFormData(updatedData);
      setForceRenderKey((prev) => prev + 1);
      setActiveTab('form');
      setHasJSONChanges(false);
      if (setDisabled) {
        setDisabled(false);
      }
    },
    [setFormData, setDisabled]
  );

  const handleFormSubmit = useCallback(
    (rjsfData: { formData?: object }) => {
      const finalFormData = {
        ...rjsfData.formData,
        ...additionalProperties,
      };
      onSubmit(finalFormData);
    },
    [additionalProperties, onSubmit]
  );

  const widgets = {
    'renders.dashboard': RjsfCodeEditorWidget,
    testableUrl: TestableUrlWidget,
  };

  if (isTenantsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Tabs
      type="card"
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
                schema={dynamicSchema as JSONSchema7}
                uiSchema={
                  isEditMode ? lockedUiSchema : dynamicUiSchema || uiSchema
                }
                validator={validator}
                customValidate={customValidate}
                templates={{
                  ObjectFieldTemplate: ObjectFieldTemplate,
                }}
                formData={formData}
                onChange={onFormDataChanged}
                onSubmit={handleFormSubmit}
                formContext={{ formData, updateFormData: setFormData }}
                widgets={widgets}
              >
                {children ? (
                  children
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{ marginTop: '20px' }}
                    block
                  >
                    Submit
                  </Button>
                )}
              </Form>
              {additionalProperties &&
                Object.keys(additionalProperties).length > 0 && (
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
            <Suspense
              fallback={
                <Spin
                  size="large"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '40px',
                  }}
                />
              }
            >
              <JSONEditor
                value={formData || {}}
                jsonSchema={dynamicSchema}
                onChange={handleJsonEditorChange}
                disableCollectionNameChange={disableCollectionNameChange}
                hasJSONChanges={hasJSONChanges}
                setHasJSONChanges={setHasJSONChanges}
                additionalProperties={additionalProperties}
                setAdditionalProperties={setAdditionalProperties}
              />
            </Suspense>
          ),
        },
      ]}
    />
  );
}

export default memo(DatasetIngestionForm);
