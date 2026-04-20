'use client';

import '@ant-design/v5-patch-for-react-19';
import React, { useState } from 'react';
import classNames from 'classnames';

import {
  FormContextType,
  GenericObjectType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
} from '@rjsf/utils';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import {
  ConfigConsumer,
  ConfigConsumerProps,
} from 'antd/lib/config-provider/context';
import Button from 'antd/lib/button';
import { CloudUploadOutlined, ImportOutlined } from '@ant-design/icons';

import COGDrawerViewer from '@/components/COGViewer/COGDrawerViewer';
import ThumbnailUploaderDrawer from '@/components/thumbnails/ThumbnailUploaderDrawer';
import { Alert } from 'antd';
import DiscoveryItemObjectFieldTemplate from './DiscoveryItemObjectFieldTemplate'; // Import the specific template

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

export default function ObjectFieldTemplate<
  T = GenericObjectType,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
    formData,
    fieldPathId,
    onAddProperty,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;
  const formContext = registry.formContext;

  const [errorMessage, setErrorMessage] = useState('');
  const [cogDrawerOpen, setCOGDrawerOpen] = useState(false);
  const [drawerUrl, setDrawerUrl] = useState<string | null>(null);
  const [renders, setRenders] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const [thumbnailDrawerOpen, setThumbnailDrawerOpen] = useState(false);

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, uiOptions);

  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const { labelAlign = 'left', rowGutter = 12 } =
    formContext as GenericObjectType;

  type FormDataLike = {
    sample_files?: string[];
    renders?: {
      dashboard?: string;
    };
    assets?: {
      thumbnail?: Record<string, unknown>;
    };
    [key: string]: unknown;
  };

  type FormContextWithUpdate = {
    formData?: FormDataLike;
    updateFormData?: (
      updater: (prevData: FormDataLike) => FormDataLike
    ) => void;
  };

  const formContextWithUpdate = formContext as
    | FormContextWithUpdate
    | undefined;

  const handleOpenCOGDrawer = () => {
    if (
      !formContextWithUpdate ||
      typeof formContextWithUpdate.updateFormData !== 'function'
    ) {
      console.error('formContext or updateFormData is not available.');
      return;
    }
    // Use full form data from formContext
    const fullFormData = formContextWithUpdate.formData || {};
    const sampleUrl: string | undefined = fullFormData?.sample_files?.[0]; // Use full form data
    const rendersDashboardEntry: string | undefined =
      fullFormData?.renders?.dashboard;

    if (!sampleUrl) {
      setErrorMessage('Sample File URL is required');
      forceUpdate((prev) => prev + 1);
      return;
    }

    setErrorMessage('');
    setDrawerUrl(sampleUrl);
    setCOGDrawerOpen(true);

    if (rendersDashboardEntry) {
      setRenders(rendersDashboardEntry);
    }
    forceUpdate((prev) => prev + 1);
  };

  const handleOpenUploadDrawer = () => {
    setThumbnailDrawerOpen(true);
    forceUpdate((prev) => prev + 1);
  };

  const handleCloseCOGDrawer = () => {
    setCOGDrawerOpen(false);
  };

  const handleUploadSuccess = (s3Uri: string) => {
    if (
      !formContextWithUpdate ||
      typeof formContextWithUpdate.updateFormData !== 'function'
    ) {
      console.error('formContext or updateFormData is not available.');
      return;
    }

    formContextWithUpdate.updateFormData((prevData: FormDataLike) => {
      const updatedFormData = {
        ...prevData,
        assets: {
          ...prevData.assets,
          thumbnail: {
            ...prevData.assets?.thumbnail,
            href: s3Uri, // only update href without overwriting other fields
          },
        },
      };

      return updatedFormData;
    });
    setThumbnailDrawerOpen(false);
  };

  const handleAcceptRenderOptions = (renderOptions: string) => {
    if (
      !formContextWithUpdate ||
      typeof formContextWithUpdate.updateFormData !== 'function'
    ) {
      console.error('formContext or updateFormData is not available.');
      return;
    }

    formContextWithUpdate.updateFormData((prevData: FormDataLike) => {
      const updatedFormData = {
        ...prevData,
        renders: {
          ...prevData.renders,
          dashboard: renderOptions, // only update renderOptions without overwriting other fields
        },
      };

      return updatedFormData;
    });
  };

  const isDashboardField = (element: ObjectFieldTemplatePropertyType) =>
    element.name === 'dashboard' &&
    (
      (element.content?.props as { fieldPathId?: { $id?: string } })
        ?.fieldPathId?.$id || ''
    ).includes('renders');
  // Apply discovery item template only to the array item object itself,
  // not nested objects like discovery_items[].assets.
  const isDiscoveryItem =
    /^root_discovery_items_\d+$/.test(fieldPathId.$id) &&
    schema.type === 'object';

  if (isDiscoveryItem) {
    return <DiscoveryItemObjectFieldTemplate {...props} />;
  }

  return (
    <ConfigConsumer>
      {(configProps: ConfigConsumerProps) => {
        const { getPrefixCls } = configProps;
        const prefixCls = getPrefixCls('form');
        const labelClsBasic = `${prefixCls}-item-label`;
        const labelColClassName = classNames(
          labelClsBasic,
          labelAlign === 'left' && `${labelClsBasic}-left`
        );

        return (
          <>
            <fieldset id={fieldPathId.$id}>
              <Row gutter={rowGutter}>
                {title && (
                  <Col className={labelColClassName} span={24}>
                    <TitleFieldTemplate
                      id={titleId(fieldPathId)}
                      title={title}
                      required={required}
                      schema={schema}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  </Col>
                )}
                {description && (
                  <Col span={24} style={DESCRIPTION_COL_STYLE}>
                    <DescriptionFieldTemplate
                      id={descriptionId(fieldPathId)}
                      description={description}
                      schema={schema}
                      uiSchema={uiSchema}
                      registry={registry}
                    />
                  </Col>
                )}
                {uiSchema?.['ui:grid'] && Array.isArray(uiSchema['ui:grid'])
                  ? uiSchema['ui:grid'].map((ui_row) =>
                      Object.keys(ui_row).map((row_item) => {
                        const element = properties.find(
                          (p) => p.name === row_item
                        );
                        if (element) {
                          const fieldId = (
                            element.content?.props as {
                              fieldPathId?: { $id?: string };
                            }
                          )?.fieldPathId?.$id;
                          const isAssetsThumbnailHrefField =
                            element.name === 'href' &&
                            fieldId === 'root_assets_thumbnail';
                          return (
                            <Col key={element.name} span={ui_row[row_item]}>
                              {isAssetsThumbnailHrefField ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                  }}
                                >
                                  {element.content}
                                  <Button
                                    type="primary"
                                    onClick={handleOpenUploadDrawer}
                                    icon={<CloudUploadOutlined />}
                                    style={{ marginTop: '14px' }}
                                  >
                                    Upload Thumbnail
                                  </Button>
                                </div>
                              ) : (
                                element.content
                              )}
                            </Col>
                          );
                        }
                        return null;
                      })
                    )
                  : properties
                      .filter((e) => !e.hidden)
                      .map((element: ObjectFieldTemplatePropertyType) => {
                        return (
                          <Col key={element.name} span={24}>
                            {isDashboardField(element) ? (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'stretch',
                                  flexDirection: 'column',
                                }}
                              >
                                {element.content}
                                {errorMessage && (
                                  <div key={errorMessage}>
                                    {' '}
                                    <Alert
                                      message={errorMessage}
                                      type="error"
                                      showIcon
                                      style={{ marginBottom: '10px' }}
                                    />
                                  </div>
                                )}
                                <Button
                                  type="primary"
                                  onClick={handleOpenCOGDrawer}
                                  icon={<ImportOutlined />}
                                >
                                  Generate Renders Object From Sample File
                                </Button>
                              </div>
                            ) : (
                              element.content
                            )}
                          </Col>
                        );
                      })}
              </Row>

              {canExpand(schema, uiSchema, formData) && (
                <Col span={24}>
                  <Row gutter={rowGutter} justify="end">
                    <Col flex="192px">
                      <AddButton
                        className="object-property-expand"
                        disabled={disabled || readonly}
                        onClick={onAddProperty}
                        uiSchema={uiSchema}
                        registry={registry}
                      />
                    </Col>
                  </Row>
                </Col>
              )}
            </fieldset>
            <COGDrawerViewer
              drawerOpen={cogDrawerOpen}
              url={drawerUrl || ''}
              renders={renders}
              onClose={handleCloseCOGDrawer}
              onAcceptRenderOptions={handleAcceptRenderOptions}
            />
            <ThumbnailUploaderDrawer
              open={thumbnailDrawerOpen}
              onClose={() => setThumbnailDrawerOpen(false)}
              onUploadSuccess={handleUploadSuccess}
            />
          </>
        );
      }}
    </ConfigConsumer>
  );
}
