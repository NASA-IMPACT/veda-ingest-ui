import React, { useState, useEffect } from 'react';
import { FieldProps, RJSFSchema } from '@rjsf/utils';
import {
  Input,
  Button,
  Row,
  Col,
  Card,
  Select,
  Form as AntdForm,
  Modal,
  Space,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Ajv from 'ajv';

const ajv = new Ajv();

const SUMMARY_TYPES = {
  JSON_SCHEMA: 'JSON Schema',
  RANGE: 'Range',
  SET: 'Set of values',
};

const getSubSchema = (schema: RJSFSchema, summaryType: string) => {
  const anyOfOptions = schema.additionalProperties?.anyOf as RJSFSchema[];
  if (!anyOfOptions) return {};
  return anyOfOptions.find((option) => option.title === summaryType) || {};
};

const fixArray = (arr: any): string[] =>
  Array.isArray(arr) ? arr.map((v) => (typeof v === 'string' ? v : '')) : [''];

const SummariesField: React.FC<FieldProps> = (props) => {
  const {
    formData,
    onChange,
    schema,
    uiSchema,
    idSchema,
    registry,
    disabled,
    readonly,
    ...rest
  } = props;

  const [internalData, setInternalData] = useState(formData || {});

  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(internalData)) {
      setInternalData(formData || {});
    }
  }, [formData]);

  const updateStateAndParent = (newData: any) => {
    console.log('Debug: internalData snapshot');
    Object.entries(newData).forEach(([key, val]) => {
      console.log(
        `Key "${key}" →`,
        val,
        'Array?',
        Array.isArray(val),
        'First item:',
        Array.isArray(val) ? val[0] : 'n/a'
      );
    });
    setInternalData(newData);
    onChange(newData);
  };

  const { SchemaField } = registry.fields;
  const { TitleFieldTemplate, DescriptionFieldTemplate } = registry.templates;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSummaryKey, setNewSummaryKey] = useState('');
  const [newSummaryType, setNewSummaryType] = useState<string>(
    SUMMARY_TYPES.RANGE
  );

  const handleShowModal = () => {
    let baseKey = 'new-summary';
    let counter = 1;
    let suggestedKey = `${baseKey}`;
    while (internalData && internalData.hasOwnProperty(suggestedKey)) {
      suggestedKey = `${baseKey}-${counter++}`;
    }
    setNewSummaryKey(suggestedKey);
    setNewSummaryType(SUMMARY_TYPES.RANGE);
    setIsModalVisible(true);
  };

  const handleAddSummary = () => {
    if (
      !newSummaryKey.trim() ||
      (internalData && internalData.hasOwnProperty(newSummaryKey))
    ) {
      return;
    }
    let defaultValue: any;
    switch (newSummaryType) {
      case SUMMARY_TYPES.JSON_SCHEMA:
        defaultValue = '{}';
        break;
      case SUMMARY_TYPES.RANGE:
        defaultValue = { minimum: 0, maximum: 100 };
        break;
      case SUMMARY_TYPES.SET:
        defaultValue = [''];
        break;
      default:
        defaultValue = {};
    }

    // Defensive fix for SET
    if (
      newSummaryType === SUMMARY_TYPES.SET &&
      (!Array.isArray(defaultValue) || typeof defaultValue[0] !== 'string')
    ) {
      defaultValue = [''];
    }

    const newData = { ...internalData, [newSummaryKey]: defaultValue };
    updateStateAndParent(newData);
    setIsModalVisible(false);
  };

  const handleRemoveSummary = (keyToRemove: string) => () => {
    const newData = { ...internalData };
    delete newData[keyToRemove];
    updateStateAndParent(newData);
  };

  const handleKeyNameChange = (oldKey: string, newKey: string) => {
    if (
      !newKey.trim() ||
      (newKey !== oldKey && internalData.hasOwnProperty(newKey))
    ) {
      return;
    }
    if (oldKey === newKey) return;

    const newData = { ...internalData };
    const summaryValue = newData[oldKey];
    delete newData[oldKey];
    newData[newKey] = summaryValue;
    updateStateAndParent(newData);
  };

  const getSummaryType = (summaryData: any): string => {
    if (typeof summaryData === 'string') return SUMMARY_TYPES.JSON_SCHEMA;
    if (Array.isArray(summaryData)) return SUMMARY_TYPES.SET;
    if (typeof summaryData === 'object' && summaryData !== null) {
      if (
        summaryData.hasOwnProperty('minimum') &&
        summaryData.hasOwnProperty('maximum')
      )
        return SUMMARY_TYPES.RANGE;
    }
    return SUMMARY_TYPES.RANGE;
  };

  const JsonSchemaField = ({
    formData: rawJson,
    onChange: onJsonChange,
    idSchema: jsonIdSchema,
  }: FieldProps) => {
    const [validationError, setValidationError] = useState<string | null>(null);
    useEffect(() => {
      if (typeof rawJson === 'string') {
        try {
          ajv.validateSchema(JSON.parse(rawJson));
          setValidationError(null);
        } catch (e) {
          setValidationError('Invalid JSON format or structure.');
        }
      }
    }, [rawJson]);
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onJsonChange(e.target.value);
    return (
      <AntdForm.Item
        validateStatus={validationError ? 'error' : 'success'}
        hasFeedback
        help={validationError || 'Valid JSON Schema'}
      >
        <Input.TextArea
          id={jsonIdSchema.$id}
          style={{
            width: '100%',
            minHeight: 200,
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          value={rawJson}
          onChange={handleTextChange}
          rows={10}
        />
      </AntdForm.Item>
    );
  };

  const anyOfOptions = schema.additionalProperties?.anyOf as RJSFSchema[];

  return (
    <fieldset id={idSchema.$id}>
      <TitleFieldTemplate
        id={idSchema.$id + '__title'}
        title={props.title || schema.title || 'Summaries'}
        required={props.required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <DescriptionFieldTemplate
        id={idSchema.$id + '__description'}
        description={props.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />

      {Object.keys(internalData || {}).map((key) => {
        const summaryData = internalData[key];
        const summaryType = getSummaryType(summaryData);

        return (
          <Card key={key} size="small" style={{ marginBottom: '16px' }}>
            <Row align="middle" gutter={8} style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Input
                  value={key}
                  onChange={(e) => handleKeyNameChange(key, e.target.value)}
                  placeholder="Summary Key (e.g., eo:bands)"
                />
              </Col>
              <Col>
                <Select value={summaryType} style={{ width: 150 }} disabled>
                  {anyOfOptions.map((option) => (
                    <Select.Option key={option.title} value={option.title}>
                      {option.title}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveSummary(key)}
                  disabled={disabled || readonly}
                />
              </Col>
            </Row>

            {summaryType === SUMMARY_TYPES.SET ? (
              <div>
                {fixArray(summaryData).map((item, index) => (
                  <Space.Compact
                    key={index}
                    style={{ width: '100%', marginBottom: 8 }}
                  >
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newArray = [...fixArray(summaryData)];
                        newArray[index] =
                          typeof e.target.value === 'string'
                            ? e.target.value
                            : '';
                        const sanitizedArray = newArray.map((v) =>
                          typeof v === 'string' ? v : ''
                        );
                        const newData = {
                          ...internalData,
                          [key]: sanitizedArray,
                        };
                        updateStateAndParent(newData);
                      }}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const newArray = fixArray(summaryData).filter(
                          (_, i) => i !== index
                        );
                        const sanitizedArray = newArray.map((v) =>
                          typeof v === 'string' ? v : ''
                        );
                        const newData = {
                          ...internalData,
                          [key]: sanitizedArray,
                        };
                        updateStateAndParent(newData);
                      }}
                    />
                  </Space.Compact>
                ))}
                <Button
                  type="dashed"
                  onClick={() => {
                    const newArray = [...fixArray(summaryData), ''];
                    const sanitizedArray = newArray.map((v) =>
                      typeof v === 'string' ? v : ''
                    );
                    const newData = { ...internalData, [key]: sanitizedArray };
                    updateStateAndParent(newData);
                  }}
                  style={{ width: '100%' }}
                  icon={<PlusOutlined />}
                >
                  Add Value
                </Button>
              </div>
            ) : (
              <SchemaField
                {...rest}
                schema={getSubSchema(schema, summaryType)}
                uiSchema={
                  summaryType === SUMMARY_TYPES.JSON_SCHEMA
                    ? { 'ui:field': 'JsonSchemaField', ...uiSchema?.[key] }
                    : { 'ui:options': { label: false }, ...uiSchema?.[key] }
                }
                idSchema={{
                  $id: `${idSchema.$id}_${key}`,
                  __id: `${idSchema.$id}_${key}`,
                  id: `${idSchema.$id}_${key}`,
                }}
                formData={summaryData}
                onChange={(val) =>
                  updateStateAndParent({ ...internalData, [key]: val })
                }
                registry={{
                  ...registry,
                  fields: {
                    ...registry.fields,
                    JsonSchemaField: JsonSchemaField,
                  },
                }}
                disabled={disabled}
                readonly={readonly}
                name={key}
              />
            )}
          </Card>
        );
      })}

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleShowModal}
        disabled={disabled || readonly}
        style={{ width: '100%' }}
      >
        Add Summary
      </Button>

      <Modal
        title="Add New Summary"
        open={isModalVisible}
        onOk={handleAddSummary}
        onCancel={() => setIsModalVisible(false)}
        okText="Add"
        cancelText="Cancel"
      >
        <AntdForm layout="vertical">
          <AntdForm.Item label="Summary Key" required>
            <Input
              value={newSummaryKey}
              onChange={(e) => setNewSummaryKey(e.target.value)}
              placeholder="e.g., eo:bands"
            />
          </AntdForm.Item>
          <AntdForm.Item label="Summary Type" required>
            <Select
              value={newSummaryType}
              onChange={setNewSummaryType}
              style={{ width: '100%' }}
            >
              {anyOfOptions.map((option) => (
                <Select.Option key={option.title} value={option.title}>
                  {option.title}
                </Select.Option>
              ))}
            </Select>
          </AntdForm.Item>
        </AntdForm>
      </Modal>
    </fieldset>
  );
};

export default SummariesField;
