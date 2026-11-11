'use client';

import { useState, useCallback } from 'react';
import AppLayout from '@/components/layout/Layout';
import ExistingCollectionsList from '@/components/ingestion/ExistingCollectionsList';
import {
  TenantErrorBoundary,
  APIErrorBoundary,
} from '@/components/error-boundaries';
import {
  Alert,
  Button,
  Form as AntdForm,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Form } from '@/components/ingestion/rjsfTheme';
import staticDiscoverSchema from '@/FormSchemas/collections/discoverSchema.json';
import discoverUiSchema from '@/FormSchemas/collections/discoverUiSchema.json';
import { JSONSchema7 } from 'json-schema';
import validator from '@rjsf/validator-ajv8';
import ObjectFieldTemplate from '@/components/rjsf-components/ObjectFieldTemplate';
import { RegexStringWidget } from '@/components/rjsf-components/RegexStringWidget';

type ExistingCollectionData = Record<string, unknown>;


const DiscoverItemsClient = () => {
  const [selectedCollection, setSelectedCollection] =
    useState<ExistingCollectionData | null>(null);
  const [discoverFormData, setDiscoverFormData] = useState<Record<string, unknown>>({})

  const handleCollectionSelect = (data: ExistingCollectionData) => {
    setSelectedCollection(data);
    setDiscoverFormData({id: data.id});
  };

  const handleDiscoverFormSubmit = () => {
    // Submit form and proceed to acceptance testing (also this will create an artifact of the config in disasters-data)
    console.log("handleDiscoverFormSubmit clicked \nForm Data: \n", discoverFormData);
    return;
  };

  const handleReturnToList = () => {
    setSelectedCollection(null);
  };

  const onRJSFDiscoverDataChanged = useCallback(
    (formState: { formData?: object }) => {
      const updatedRjsfData =
        (formState.formData as Record<string, unknown>) ?? {};
        setDiscoverFormData((prev) => ({ ...prev, ...updatedRjsfData }));
    },
    [setDiscoverFormData]
  );
  console.log(`selectedCollection: `, selectedCollection)
  return (
    <AppLayout>
      <TenantErrorBoundary>
        <APIErrorBoundary
          onRetry={() => {
            if (selectedCollection) {
              setSelectedCollection(null);
            }
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              width: '100%',
            }}
            aria-live="assertive"
            role="alert"
          >
            <Alert
              message="Warning: Changes here will affect the published collection."
              type="warning"
              showIcon
              banner
            />
            <div style={{ paddingBottom: 16 }} />
          </div>
          {selectedCollection ? (
            <>
              <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                onClick={handleReturnToList}
                style={{ marginBottom: 16 }}
                aria-label="Back to collection list"
              >
                Back
              </Button>
              <AntdForm onFinish={handleDiscoverFormSubmit}>
                <Form
                  schema={staticDiscoverSchema as JSONSchema7}
                  uiSchema={(discoverUiSchema as unknown) as JSONSchema7}
                  validator={validator}
                  templates={{ ObjectFieldTemplate }}
                  formData={discoverFormData}
                  onChange={onRJSFDiscoverDataChanged}
                  widgets={{
                    regexString: RegexStringWidget
                  }}
                  tagName="div"
                >
                  <></>
                </Form>

                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ marginTop: '20px' }}
                  block
                >
                  Submit
                </Button>
              </AntdForm>
            </>
          ) : (
            <ExistingCollectionsList
              onCollectionSelect={handleCollectionSelect}
              title="Append Items to Existing Collections"
            />
          )}
        </APIErrorBoundary>
      </TenantErrorBoundary>
    </AppLayout>
  );
};

export default DiscoverItemsClient;
