import React, { useState, useEffect } from 'react';
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
  Tag,
  Typography,
  Tooltip,
} from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';

// Placeholder for your CodeEditorWidget. You can replace this with your actual import.
const CodeEditorWidget: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <Input.TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={8}
      style={{
        fontSize: 14,
        backgroundColor: '#f5f5f5',
        fontFamily:
          'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
        borderRadius: '6px',
      }}
    />
  );
};

interface SummariesManagerProps {
  initialData?: { [key: string]: any };
  onChange: (data: { [key: string]: any }) => void;
  disabled?: boolean;
  readonly?: boolean;
}

const SUMMARY_TYPES = {
  JSON_SCHEMA: 'JSON Schema',
  RANGE: 'Range',
  SET: 'Set of values',
};

const SummariesManager: React.FC<SummariesManagerProps> = ({
  initialData = {},
  onChange,
  disabled,
  readonly,
}) => {
  const [summaries, setSummaries] = useState(initialData);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSummaryKey, setNewSummaryKey] = useState('');
  const [newSummaryType, setNewSummaryType] = useState<string>(
    SUMMARY_TYPES.RANGE
  );

  // State for modal inputs
  const [modalSetValues, setModalSetValues] = useState<string[]>(['']);
  const [modalRange, setModalRange] = useState({ minimum: 0, maximum: 100 });
  const [modalJsonSchema, setModalJsonSchema] = useState('{}');

  const anyOfOptions = [
    { title: 'JSON Schema' },
    { title: 'Range' },
    { title: 'Set of values' },
  ];

  // Effect to update internal state if the initialData prop changes from outside
  useEffect(() => {
    setSummaries(initialData);
  }, [initialData]);

  const updateSummaries = (newSummaries: { [key: string]: any }) => {
    setSummaries(newSummaries);
    onChange(newSummaries);
  };

  const handleShowModal = () => {
    let baseKey = 'new-summary';
    let counter = 1;
    let suggestedKey = `${baseKey}`;
    while (summaries && summaries.hasOwnProperty(suggestedKey)) {
      suggestedKey = `${baseKey}-${counter++}`;
    }
    setNewSummaryKey(suggestedKey);
    // Reset all modal inputs to their defaults
    setNewSummaryType(SUMMARY_TYPES.RANGE);
    setModalSetValues(['']);
    setModalRange({ minimum: 0, maximum: 100 });
    setModalJsonSchema('{}');
    setIsModalVisible(true);
  };

  const handleAddSummary = () => {
    if (
      !newSummaryKey.trim() ||
      (summaries && summaries.hasOwnProperty(newSummaryKey))
    )
      return;

    let defaultValue: any;
    switch (newSummaryType) {
      case SUMMARY_TYPES.JSON_SCHEMA:
        defaultValue = modalJsonSchema;
        break;
      case SUMMARY_TYPES.RANGE:
        defaultValue = modalRange;
        break;
      case SUMMARY_TYPES.SET:
        defaultValue = modalSetValues.filter((v) => v && v.trim() !== '');
        break;
      default:
        defaultValue = {};
    }
    const newSummaries = { ...summaries, [newSummaryKey]: defaultValue };
    updateSummaries(newSummaries);
    setIsModalVisible(false);
  };

  const handleRemoveSummary = (keyToRemove: string) => () => {
    const newSummaries = { ...summaries };
    delete newSummaries[keyToRemove];
    updateSummaries(newSummaries);
  };

  const getSummaryType = (summaryData: any): string => {
    if (typeof summaryData === 'string') return SUMMARY_TYPES.JSON_SCHEMA;
    if (Array.isArray(summaryData)) return SUMMARY_TYPES.SET;
    if (
      typeof summaryData === 'object' &&
      summaryData?.minimum !== undefined &&
      summaryData?.maximum !== undefined
    )
      return SUMMARY_TYPES.RANGE;
    return SUMMARY_TYPES.RANGE;
  };

  const renderSummaryData = (type: string, data: any) => {
    switch (type) {
      case SUMMARY_TYPES.SET:
        return (
          <div>
            {(data as string[]).map((v, i) => (
              <Tag key={i}>{v || '(empty)'}</Tag>
            ))}
          </div>
        );
      case SUMMARY_TYPES.RANGE:
        return (
          <Typography.Text>
            Minimum: {data.minimum}, Maximum: {data.maximum}
          </Typography.Text>
        );
      case SUMMARY_TYPES.JSON_SCHEMA:
        try {
          // Try to pretty-print the JSON
          return (
            <pre
              style={{
                margin: 0,
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
              }}
            >
              {JSON.stringify(JSON.parse(data), null, 2)}
            </pre>
          );
        } catch (e) {
          // If it's invalid JSON, show the raw string
          return (
            <pre
              style={{
                margin: 0,
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                color: 'red',
              }}
            >
              {data}
            </pre>
          );
        }
      default:
        return null;
    }
  };

  return (
    <fieldset id="summaries_manager" style={{ marginTop: 0 }}>
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        Summaries
      </Typography.Title>

      {Object.keys(summaries || {}).length > 0 ? (
        Object.keys(summaries).map((key) => {
          const summaryData = summaries[key];
          const summaryType = getSummaryType(summaryData);

          return (
            <Card key={key} size="small" style={{ marginBottom: '16px' }}>
              <Row align="top" gutter={8}>
                <Col flex="auto">
                  <Typography.Text strong>{key}</Typography.Text>
                  <div style={{ marginTop: '10px' }}>
                    {renderSummaryData(summaryType, summaryData)}
                  </div>
                </Col>
                <Col flex="none">
                  <Tooltip title="Remove Summary">
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveSummary(key)}
                      disabled={disabled || readonly}
                    />
                  </Tooltip>
                </Col>
              </Row>
            </Card>
          );
        })
      ) : (
        <div /> // Placeholder for when the list is empty
      )}

      <Row justify="end" style={{ marginTop: 0 }}>
        <Col style={{ flex: '0 0 168px' }}>
          <Tooltip title="Add Summary">
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleShowModal}
              disabled={disabled || readonly}
              block
            />
          </Tooltip>
        </Col>
      </Row>

      <Modal
        title="Add New Summary"
        open={isModalVisible}
        onOk={handleAddSummary}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
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

          {newSummaryType === SUMMARY_TYPES.SET && (
            <AntdForm.Item label="Values">
              {modalSetValues.map((val, index) => (
                <Space.Compact
                  key={index}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  <Input
                    value={val}
                    onChange={(e) => {
                      const updated = [...modalSetValues];
                      updated[index] = e.target.value;
                      setModalSetValues(updated);
                    }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const updated = modalSetValues.filter(
                        (_, i) => i !== index
                      );
                      setModalSetValues(updated.length > 0 ? updated : ['']);
                    }}
                  />
                </Space.Compact>
              ))}
              <Button
                type="dashed"
                onClick={() => setModalSetValues([...modalSetValues, ''])}
                icon={<PlusCircleOutlined />}
                style={{ width: '100%' }}
              >
                Add Value
              </Button>
            </AntdForm.Item>
          )}

          {newSummaryType === SUMMARY_TYPES.RANGE && (
            <Space>
              <AntdForm.Item label="Minimum">
                <Input
                  type="number"
                  value={modalRange.minimum}
                  onChange={(e) =>
                    setModalRange({
                      ...modalRange,
                      minimum: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </AntdForm.Item>
              <AntdForm.Item label="Maximum">
                <Input
                  type="number"
                  value={modalRange.maximum}
                  onChange={(e) =>
                    setModalRange({
                      ...modalRange,
                      maximum: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </AntdForm.Item>
            </Space>
          )}

          {newSummaryType === SUMMARY_TYPES.JSON_SCHEMA && (
            <AntdForm.Item label="JSON Schema">
              <CodeEditorWidget
                value={modalJsonSchema}
                onChange={setModalJsonSchema}
              />
            </AntdForm.Item>
          )}
        </AntdForm>
      </Modal>
    </fieldset>
  );
};

export default SummariesManager;
