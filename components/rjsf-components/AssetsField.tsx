import React, { useState, useCallback, useEffect } from 'react';
import { FieldProps, RJSFSchema, FieldPathId } from '@rjsf/utils';
import { Button, Row, Col, Card, Tooltip } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import EditableAssetRow from './EditableAssetRow';
const AssetsField: React.FC<FieldProps> = (props) => {
  const {
    formData,
    onChange,
    schema,
    uiSchema,
    fieldPathId,
    registry,
    disabled,
    readonly,
    title,
    required,
    description,
  } = props;
  const formContext = registry.formContext;

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
    onChange(newFormData, fieldPathId.path);
  }, [formData, onChange, generateUniqueKey, schema, fieldPathId]);

  const handleRemoveAsset = useCallback(
    (keyToRemove: string) => () => {
      const newFormData = { ...formData };
      delete newFormData[keyToRemove];
      onChange(newFormData, fieldPathId.path);
    },
    [formData, onChange, fieldPathId]
  );

  const handleKeyNameChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (
        !newKey.trim() ||
        (newKey !== oldKey && formData && formData.hasOwnProperty(newKey))
      ) {
        onChange({ ...formData }, fieldPathId.path);
        return;
      }
      if (oldKey === newKey) return;

      const newFormData = Object.keys(formData).reduce((acc, currentKey) => {
        const targetKey = currentKey === oldKey ? newKey : currentKey;
        acc[targetKey] = formData[currentKey];
        return acc;
      }, {} as any);

      onChange(newFormData, fieldPathId.path);
    },
    [formData, onChange, fieldPathId]
  );

  const assetDetailsSchema: RJSFSchema =
    typeof schema.additionalProperties === 'object'
      ? (schema.additionalProperties as RJSFSchema)
      : {};

  return (
    <div id={fieldPathId.$id}>
      <TitleFieldTemplate
        id={fieldPathId.$id + '__title'}
        title={title ?? schema.title ?? ''}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <DescriptionFieldTemplate
        id={fieldPathId.$id + '__description'}
        description={description ?? schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />

      {orderedAssetKeys.map((key: string, index: number) => {
        const assetIdSchema: FieldPathId = {
          $id: `${fieldPathId.$id}_${key}`,
          path: [...fieldPathId.path, key],
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
                fieldPathId={assetIdSchema}
                formData={assetFormData}
                onChange={(newAssetValue, childPath) => {
                  onChange(newAssetValue, childPath || assetIdSchema.path);
                }}
                name={key}
                required={false}
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
