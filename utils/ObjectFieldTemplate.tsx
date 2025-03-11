'use client'; // Ensure this component is client-side only

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

import COGDrawerViewer from '@/components/COGDrawerViewer';
import ThumbnailUploaderDrawer from '@/components/ThumbnailUploaderDrawer';
import { Alert } from 'antd';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

interface KnownFields {
  assets?: {
    thumbnail?: {
      href?: string;
    };
  };
  renders?: {
    dashboard?: string;
  };
}

// Merge known fields with generic form data
type FormDataType = KnownFields & Record<string, any>;

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
    formContext,
    formData,
    idSchema,
    onAddClick,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;

  const typedFormData = formData as FormDataType;

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

  const handleOpenCOGDrawer = () => {
    const sampleUrl: string | undefined = typedFormData?.sample_files?.[0];
    const rendersDashboardEntry: string | undefined =
      typedFormData?.renders?.dashboard;

    if (!sampleUrl) {
      setErrorMessage('Sample File URL is required');
      forceUpdate((prev) => prev + 1); // Force re-render
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
    if (!formContext || typeof formContext.updateFormData !== 'function') {
      console.error('❌ formContext or updateFormData is not available.');
      return;
    }

    formContext.updateFormData((prevData: any) => {
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
  };

  const handleAcceptRenderOptions = (renderOptions: string) => {
    if (!formContext || typeof formContext.updateFormData !== 'function') {
      console.error('❌ formContext or updateFormData is not available.');
      return;
    }

    const updatedFormData = { ...typedFormData };

    // Ensure `renders` exists before accessing `dashboard`
    updatedFormData.renders = updatedFormData.renders || {};
    updatedFormData.renders.dashboard = renderOptions;

    formContext.updateFormData(updatedFormData);
  };

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
            <fieldset id={idSchema.$id}>
              <Row gutter={rowGutter}>
                {title && (
                  <Col className={labelColClassName} span={24}>
                    <TitleFieldTemplate
                      id={titleId<T>(idSchema)}
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
                      id={descriptionId<T>(idSchema)}
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
                          const isRendersField = element.name === 'renders';
                          const isAssetsThumbnailHrefField =
                            element.name === 'href' &&
                            element.content?.props?.idSchema?.$id ===
                              'root_assets_thumbnail_href';
                          return (
                            <Col key={element.name} span={ui_row[row_item]}>
                              {isRendersField ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: '10px',
                                  }}
                                >
                                  {errorMessage && (
                                    <div key={errorMessage}>
                                      {' '}
                                      <Alert
                                        message={errorMessage}
                                        type="error"
                                        showIcon
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
                                  {element.content}
                                </div>
                              ) : isAssetsThumbnailHrefField ? (
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
                      .map((element: ObjectFieldTemplatePropertyType) => (
                        <Col key={element.name} span={24}>
                          {element.name === 'renders' ? (
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
                                onClick={handleOpenCOGDrawer}
                                style={{ marginLeft: '10px' }}
                              >
                                Open Viewer
                              </Button>
                            </div>
                          ) : (
                            element.content
                          )}
                        </Col>
                      ))}
              </Row>

              {canExpand(schema, uiSchema, formData) && (
                <Col span={24}>
                  <Row gutter={rowGutter} justify="end">
                    <Col flex="192px">
                      <AddButton
                        className="object-property-expand"
                        disabled={disabled || readonly}
                        onClick={onAddClick(schema)}
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
              formContext={formContext}
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
