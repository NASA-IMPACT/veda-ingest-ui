import React, { useState, useCallback, useEffect } from 'react';
import { FieldProps, RJSFSchema, IdSchema } from '@rjsf/utils';
import { Button, Row, Col, Card, Tooltip } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import EditableAssetRow from './EditableAssetRow';
const AssetsField: React.FC<FieldProps> = (props) => {
  const {
    formData,
    onChange,
    schema,
    uiSchema,
    idSchema,
    registry,
    disabled,
    readonly,
    formContext,
    title,
    required,
    description,
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
    let newKey = newKeyBase;
    while (formData && formData.hasOwnProperty(newKey)) {
      newKey = `${newKeyBase}_${counter++}`;
    }
    return newKey;
  }, [formData]);

  const handleAddAsset = useCallback(() => {
    const newKey = generateUniqueKey();
    const newFormData = { ...formData };

    let newAssetValue = {
      href: '',
      title: '',
      description: '',
      type: '',
      roles: [],
    };
    if (
      schema.additionalProperties &&
      typeof schema.additionalProperties === 'object' &&
      'default' in schema.additionalProperties
    ) {
      newAssetValue = {
        ...newAssetValue,
        ...(schema.additionalProperties.default as object),
      };
    }

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
        onChange({ ...formData });
        return;
      }
      if (oldKey === newKey) return;

      const newFormData = Object.keys(formData).reduce((acc, currentKey) => {
        const targetKey = currentKey === oldKey ? newKey : currentKey;
        acc[targetKey] = formData[currentKey];
        return acc;
      }, {} as any);

      onChange(newFormData);
    },
    [formData, onChange]
  );

  const assetDetailsSchema: RJSFSchema =
    typeof schema.additionalProperties === 'object'
      ? (schema.additionalProperties as RJSFSchema)
      : {};

  return (
    <div id={idSchema.$id}>
      <TitleFieldTemplate
        id={idSchema.$id + '__title'}
        title={title ?? schema.title ?? ''}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <DescriptionFieldTemplate
        id={idSchema.$id + '__description'}
        description={description ?? schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />

      {orderedAssetKeys.map((key: string, index: number) => {
        const assetIdSchema: IdSchema = {
          ...(idSchema as any)[key],
          $id: `${idSchema.$id}_${key}`,
        };
        const assetFormData = formData?.[key] ?? {};

        return (
          <Card key={key} size="small" style={{ marginBottom: '16px' }}>
            <EditableAssetRow
              initialKey={key}
              index={index}
              onKeyChange={handleKeyNameChange}
              onRemove={handleRemoveAsset}
              disabled={disabled}
              readonly={readonly}
            />
            <div style={{ marginTop: '16px' }}>
              <SchemaField
                {...props}
                schema={assetDetailsSchema}
                uiSchema={uiSchema?.[key] || {}}
                idSchema={assetIdSchema}
                formData={assetFormData}
                onChange={(newAssetValue) => {
                  onChange({ ...formData, [key]: newAssetValue });
                }}
                name={key}
              />
            </div>
          </Card>
        );
      })}

      <Row justify="end" style={{ marginTop: '16px' }}>
        <Col style={{ flex: '0 0 168px' }}>
          <Tooltip title="Add Asset">
            <Button
              aria-label="Add Asset"
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleAddAsset}
              disabled={disabled || readonly}
              block
            />
          </Tooltip>
        </Col>
      </Row>
    </div>
  );
};

export default AssetsField;
