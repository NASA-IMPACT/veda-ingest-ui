import React, { useState, useCallback, useEffect } from 'react';
import { FieldProps, RJSFSchema } from '@rjsf/utils';
import { Input, Button, Row, Col, Card, Tooltip } from 'antd'; // Import Tooltip
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons'; // Import PlusCircleOutlined

const AssetsField: React.FC<FieldProps> = (props) => {
  const {
    formData, // This is the object containing all assets: { key1: {href:...}, key2: {href:...}}
    onChange,
    schema, // Schema for the 'assets' object
    uiSchema, // UI Schema for the 'assets' object
    idSchema,
    registry,
    disabled,
    readonly,
    formContext,
  } = props;

  const { SchemaField } = registry.fields;
  const { TitleFieldTemplate, DescriptionFieldTemplate } = registry.templates;

  // Local state to manage the order of asset keys for display.
  const [orderedAssetKeys, setOrderedAssetKeys] = useState<string[]>([]);

  useEffect(() => {
    // Synchronize the ordered keys with the formData object
    const currentKeys = Object.keys(formData || {});
    setOrderedAssetKeys(currentKeys);
  }, [formData]);

  const generateUniqueKey = useCallback(() => {
    let newKeyBase = 'new_asset';
    let counter = 1;
    let newKey = `${newKeyBase}`;
    // Ensure the generated key is unique within the current formData
    while (formData && formData.hasOwnProperty(newKey)) {
      newKey = `${newKeyBase}_${counter++}`;
    }
    return newKey;
  }, [formData]);

  const handleAddAsset = useCallback(() => {
    const newKey = generateUniqueKey();
    const newFormData = { ...formData };

    // Use the default value from the schema if available, otherwise provide a sensible default
    const newAssetValue = schema.additionalProperties?.default || {
      href: '',
      title: '',
      description: '',
      type: '',
      roles: [],
    };
    newFormData[newKey] = newAssetValue;

    onChange(newFormData);
  }, [formData, onChange, generateUniqueKey, schema]);

  const handleRemoveAsset = useCallback(
    (keyToRemove: string) => () => {
      const newFormData = { ...formData };
      delete newFormData[keyToRemove];
      onChange(newFormData);
    },
    [formData, onChange]
  );

  const handleKeyNameChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (
        !newKey.trim() ||
        (newKey !== oldKey && formData && formData.hasOwnProperty(newKey))
      ) {
        return;
      }
      if (oldKey === newKey) return;

      // Recreate the object to preserve key order if possible, though not guaranteed
      const newFormData = Object.keys(formData).reduce((acc, currentKey) => {
        if (currentKey === oldKey) {
          acc[newKey] = formData[oldKey];
        } else {
          acc[currentKey] = formData[currentKey];
        }
        return acc;
      }, {} as any);

      onChange(newFormData);
    },
    [formData, onChange]
  );

  // Get the schema for the asset details (from additionalProperties)
  const assetDetailsSchema = (schema.additionalProperties as RJSFSchema) || {
    type: 'object',
  };

  return (
    <div id={idSchema.$id}>
      <TitleFieldTemplate
        id={idSchema.$id + '__title'}
        title={props.title ?? schema.title}
        required={props.required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <DescriptionFieldTemplate
        id={idSchema.$id + '__description'}
        description={props.description ?? schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />

      {/* Map over our locally ordered list of keys */}
      {orderedAssetKeys.map((key: string, index: number) => {
        const assetIdSchema = {
          ...idSchema,
          [key]: { $id: `${idSchema.$id}_${key}` },
        }[key];
        const assetFormData = formData?.[key] ?? {};

        return (
          <Card key={key} size="small" style={{ marginBottom: '16px' }}>
            <Row align="middle" gutter={8} wrap={false}>
              <Col flex="auto">
                <Input
                  value={key}
                  onChange={(e) => handleKeyNameChange(key, e.target.value)}
                  placeholder={`Asset key (e.g., thumbnail)`}
                  addonBefore={`Asset #${index + 1}`}
                />
              </Col>
              <Col flex="none">
                <Tooltip title="Remove Asset">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAsset(key)}
                    disabled={disabled || readonly}
                  />
                </Tooltip>
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <SchemaField
                schema={assetDetailsSchema}
                uiSchema={uiSchema?.[key] || {}}
                idSchema={assetIdSchema}
                formData={assetFormData}
                onChange={(newAssetValue) => {
                  onChange({ ...formData, [key]: newAssetValue });
                }}
                registry={registry}
                disabled={disabled}
                readonly={readonly}
                name={key}
                formContext={formContext}
              />
            </div>
          </Card>
        );
      })}

      {/* Button is now on its own row at the bottom, right-aligned */}
      <Row justify="end" style={{ marginTop: '16px' }}>
        <Col style={{ flex: '0 0 168px' }}>
          <Tooltip title="Add Asset">
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleAddAsset}
              disabled={disabled || readonly}
              block // This makes the button fill the Col's width
            />
          </Tooltip>
        </Col>
      </Row>
    </div>
  );
};

export default AssetsField;
