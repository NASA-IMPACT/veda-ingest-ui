import React, { useState, useCallback, useEffect } from 'react';
import { FieldProps, RJSFSchema, getTemplate } from '@rjsf/utils';
import { Input, Button, Row, Col, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

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
  // This helps assign sequential numbers for display, even if the underlying object is unordered.
  const [orderedAssetKeys, setOrderedAssetKeys] = useState<string[]>([]);

  useEffect(() => {
    // Get current keys from formData and filter out any existing ones
    const currentKeys = Object.keys(formData || {});
    const newKeysToAdd = currentKeys.filter(
      (key) => !orderedAssetKeys.includes(key)
    );

    // Remove keys that no longer exist in formData
    const updatedOrderedKeys = orderedAssetKeys.filter((key) =>
      currentKeys.includes(key)
    );

    // Add new keys to the end of the ordered list
    setOrderedAssetKeys([...updatedOrderedKeys, ...newKeysToAdd]);
  }, [formData]); // Dependency on formData ensures we react to external changes

  const generateUniqueKey = useCallback(() => {
    let newKeyBase = 'asset';
    let counter = 1;
    let newKey = `${newKeyBase}_${counter}`;
    // Ensure the generated key is unique within the current formData
    while (formData && formData.hasOwnProperty(newKey)) {
      counter++;
      newKey = `${newKeyBase}_${counter}`;
    }
    return newKey;
  }, [formData]);

  const handleAddAsset = useCallback(() => {
    const newKey = generateUniqueKey();
    const newFormData = { ...formData };

    const newAssetValue: RJSFSchema = {
      href: '', // Default for string
      title: '',
      description: '',
      type: '',
      roles: [], // Default for array
    };
    newFormData[newKey] = newAssetValue;

    onChange(newFormData);
    // Immediately add the new key to our local ordered list for correct display numbering
    setOrderedAssetKeys((prevKeys) => [...prevKeys, newKey]);
  }, [formData, onChange, generateUniqueKey]);

  const handleRemoveAsset = useCallback(
    (keyToRemove: string) => () => {
      const newFormData = { ...formData };
      delete newFormData[keyToRemove]; // Remove from formData
      onChange(newFormData);
      // Remove from our local ordered list
      setOrderedAssetKeys((prevKeys) =>
        prevKeys.filter((k) => k !== keyToRemove)
      );
    },
    [formData, onChange]
  );

  const handleKeyNameChange = useCallback(
    (oldKey: string, newKey: string) => {
      // Basic validation: Don't allow empty key or existing key
      if (
        !newKey.trim() ||
        (newKey !== oldKey && formData && formData.hasOwnProperty(newKey))
      ) {
        return;
      }
      if (oldKey === newKey) return;

      const newFormData = { ...formData };
      const assetValue = newFormData[oldKey];
      delete newFormData[oldKey];
      newFormData[newKey] = assetValue;

      onChange(newFormData);

      // Update the local ordered keys list to reflect the rename
      setOrderedAssetKeys((prevKeys) =>
        prevKeys.map((k) => (k === oldKey ? newKey : k))
      );
    },
    [formData, onChange] // Dependencies: formData and onChange
  );

  // Get the schema for the asset details (from additionalProperties)
  const assetDetailsSchema = (schema.additionalProperties as RJSFSchema) || {
    type: 'object',
  };

  return (
    <div id={idSchema.$id}>
      <TitleFieldTemplate
        id={idSchema.$id + '__title'}
        title={schema.title || props.title}
        required={props.required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <DescriptionFieldTemplate
        id={idSchema.$id + '__description'}
        description={schema.description || props.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />

      {/* Map over our locally ordered list of keys */}
      {orderedAssetKeys.map((key: string, index: number) => {
        // Create an ID schema for the current asset property
        const assetIdSchema = {
          $id: `${idSchema.$id}_${key}`, // e.g., root_assets_thumbnail
          __id: `${idSchema.$id}_${key}`,
          id: `${idSchema.$id}_${key}`,
        };
        // Get formData for this specific asset property
        const assetFormData =
          formData && formData[key] ? (formData[key] as object) : {};

        return (
          <Card
            key={key} // Use the asset's actual key name as React's key
            size="small"
            style={{ marginBottom: '16px' }}
            title={
              <Row align="middle" gutter={8}>
                <Col flex="auto">
                  <Input
                    value={key}
                    onChange={(e) => handleKeyNameChange(key, e.target.value)}
                    placeholder={`Asset #${index + 1} (e.g., thumbnail)`}
                    prefix={
                      <span
                        style={{ marginRight: '8px', fontWeight: 'bold' }}
                      >{`Asset #${index + 1}:`}</span>
                    }
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAsset(key)}
                    disabled={disabled || readonly}
                  />
                </Col>
              </Row>
            }
          >
            {/* Render the form for the actual asset details (href, title, etc.) */}
            <SchemaField
              schema={assetDetailsSchema} // Schema for the inner object (href, title, etc.)
              uiSchema={uiSchema?.[key] || {}} // Pass any specific UI schema for this asset key
              idSchema={assetIdSchema}
              formData={assetFormData}
              onChange={(newAssetValue) => {
                onChange({ ...formData, [key]: newAssetValue }); // Update formData for this specific asset
              }}
              registry={registry}
              disabled={disabled}
              readonly={readonly}
              name={key} // The name of the property (e.g., 'thumbnail')
              formContext={formContext}
            />
          </Card>
        );
      })}

      <Button
        className="add-asset-button"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddAsset}
        disabled={disabled || readonly}
        style={{ width: '100%' }}
      >
        Add Asset
      </Button>
    </div>
  );
};

export default AssetsField;
