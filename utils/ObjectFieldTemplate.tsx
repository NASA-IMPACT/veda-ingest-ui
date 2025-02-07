import React, { useState } from 'react';
import classNames from 'classnames';
import isObject from 'lodash/isObject';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import {
  FormContextType,
  GenericObjectType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
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
import message from 'antd/lib/message';
import { ImportOutlined } from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';

import COGDrawerViewer from '@/components/COGDrawerViewer';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

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

  const {
    colSpan = 24,
    labelAlign = 'left',
    rowGutter = 12,
  } = formContext as GenericObjectType;

  const findSchema = (element: ObjectFieldTemplatePropertyType): S =>
    element.content.props.schema;

  const findSchemaType = (element: ObjectFieldTemplatePropertyType) =>
    findSchema(element).type;

  const findUiSchema = (
    element: ObjectFieldTemplatePropertyType
  ): UiSchema<T, S, F> | undefined => element.content.props.uiSchema;

  const findUiSchemaField = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).field;

  const findUiSchemaWidget = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).widget;

  const calculateColSpan = (element: ObjectFieldTemplatePropertyType) => {
    const type = findSchemaType(element);
    const field = findUiSchemaField(element);
    const widget = findUiSchemaWidget(element);

    const defaultColSpan =
      properties.length < 2 || // Single or no field in object.
      type === 'object' ||
      type === 'array' ||
      widget === 'textarea'
        ? 24
        : 12;

    if (isObject(colSpan)) {
      const colSpanObj: GenericObjectType = colSpan;
      if (isString(widget)) {
        return colSpanObj[widget];
      }
      if (isString(field)) {
        return colSpanObj[field];
      }
      if (isString(type)) {
        return colSpanObj[type];
      }
    }
    if (isNumber(colSpan)) {
      return colSpan;
    }
    return defaultColSpan;
  };

  const typedFormData = formData as Record<string, any>;

  const [drawerOpen, setdrawerOpen] = useState(false);
  const [drawerUrl, setDrawerUrl] = useState<string | null>(null);

  const handleOpenDrawer = () => {
    const sampleUrl = typedFormData?.sample_files?.[0];
    if (sampleUrl) {
      setDrawerUrl(sampleUrl);
      setdrawerOpen(true);
    } else {
      console.error('A sample URL is required to open the viewer.');
    }
  };

  const handleCloseDrawer = () => {
    setdrawerOpen(false);
  };

  const handleAcceptRenderOptions = (renderOptions: string) => {
    if (!formContext || typeof formContext.updateFormData !== 'function') {
      console.error('❌ formContext or updateFormData is not available.');
      return;
    }

    const updatedFormData = { ...typedFormData };
    updatedFormData.renders = updatedFormData.renders || {};

    updatedFormData.renders = renderOptions;

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
                                  <Button
                                    type="primary"
                                    onClick={handleOpenDrawer}
                                    icon={<ImportOutlined />}
                                  >
                                    Generate Renders Object From Sample File
                                  </Button>
                                  {element.content}
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
                                onClick={handleOpenDrawer}
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

            {/* COGDrawerViewer Component */}
            <COGDrawerViewer
              drawerOpen={drawerOpen}
              url={drawerUrl || ''}
              onClose={handleCloseDrawer}
              onAcceptRenderOptions={handleAcceptRenderOptions}
              formContext={formContext} // Pass it explicitly
            />
          </>
        );
      }}
    </ConfigConsumer>
  );
}
