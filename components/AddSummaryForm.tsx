import React, { useState, useEffect } from 'react';
import { Input, Button, Select, Form as AntdForm, Space } from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import CodeEditorWidget from './CodeEditorWidget';

const SUMMARY_TYPES = {
  JSON_SCHEMA: 'JSON Schema',
  RANGE: 'Range',
  SET: 'Set of values',
};

interface AddSummaryFormProps {
  initialKey: string;
  onAdd: (summary: { key: string; value: any }) => void;
  onCancel: () => void;
}

export const AddSummaryForm: React.FC<AddSummaryFormProps> = ({
  initialKey,
  onAdd,
  onCancel,
}) => {
  const [form] = AntdForm.useForm();
  const [newSummaryType, setNewSummaryType] = useState<string>(
    SUMMARY_TYPES.RANGE
  );

  // Use useEffect to set initial values to avoid issues with component lifecycle
  useEffect(() => {
    form.setFieldsValue({
      key: initialKey,
      type: SUMMARY_TYPES.RANGE,
      set: [''],
      range: { minimum: 0, maximum: 100 },
      json_schema: '{}',
    });
  }, [initialKey, form]);

  const handleFinish = (values: any) => {
    const { key, type } = values;
    if (!key || !key.trim()) return;

    let value: any;
    switch (type) {
      case SUMMARY_TYPES.JSON_SCHEMA:
        try {
          value = JSON.parse(values.json_schema);
        } catch {
          value = values.json_schema; // Keep as string if invalid JSON
        }
        break;
      case SUMMARY_TYPES.RANGE:
        // FIX: Parse the string values from the input into numbers.
        value = {
          minimum: parseFloat(values.range.minimum) || 0,
          maximum: parseFloat(values.range.maximum) || 0,
        };
        break;
      case SUMMARY_TYPES.SET:
        value = values.set.filter((v: string) => v && v.trim() !== '');
        break;
      default:
        value = {};
    }
    onAdd({ key, value });
  };

  return (
    <AntdForm form={form} layout="vertical" onFinish={handleFinish}>
      <AntdForm.Item
        label="Summary Key"
        name="key"
        required
        rules={[{ required: true, message: 'Key is required.' }]}
      >
        <Input placeholder="e.g., eo:bands" />
      </AntdForm.Item>

      <AntdForm.Item label="Summary Type" name="type" required>
        <Select
          onChange={setNewSummaryType}
          style={{ width: '100%' }}
          value={newSummaryType}
        >
          {Object.values(SUMMARY_TYPES).map((type) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </AntdForm.Item>

      {newSummaryType === SUMMARY_TYPES.SET && (
        <AntdForm.List name="set">
          {(fields, { add, remove }) => (
            <AntdForm.Item label="Values">
              {fields.map((field, index) => (
                <Space.Compact
                  key={field.key}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  <AntdForm.Item key={field.key} name={field.name} noStyle>
                    <Input placeholder="Enter value" />
                  </AntdForm.Item>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(index)}
                  />
                </Space.Compact>
              ))}
              <Button
                onClick={() => add('')}
                icon={<PlusCircleOutlined />}
                block
              >
                Add Value
              </Button>
            </AntdForm.Item>
          )}
        </AntdForm.List>
      )}

      {newSummaryType === SUMMARY_TYPES.RANGE && (
        <Space>
          <AntdForm.Item label="Minimum" name={['range', 'minimum']}>
            <Input type="number" />
          </AntdForm.Item>
          <AntdForm.Item label="Maximum" name={['range', 'maximum']}>
            <Input type="number" />
          </AntdForm.Item>
        </Space>
      )}

      {newSummaryType === SUMMARY_TYPES.JSON_SCHEMA && (
        <AntdForm.Item label="JSON Schema" name="json_schema">
          {/* This assumes CodeEditorWidget can be used as a form control */}
          <CodeEditorWidget
            value="{}"
            onChange={(val) => form.setFieldsValue({ json_schema: val })}
          />
        </AntdForm.Item>
      )}

      <AntdForm.Item
        style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}
      >
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Add
          </Button>
        </Space>
      </AntdForm.Item>
    </AntdForm>
  );
};
