// components/SummariesManager.tsx
import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Modal, Typography, Tooltip, Tag } from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { AddSummaryForm } from './AddSummaryForm'; // Import the new component

const SUMMARY_TYPES = {
  JSON_SCHEMA: 'JSON Schema',
  RANGE: 'Range',
  SET: 'Set of values',
};

type RangeSummary = {
  minimum?: unknown;
  maximum?: unknown;
};

const isRangeSummary = (summaryData: unknown): summaryData is RangeSummary => {
  return (
    typeof summaryData === 'object' &&
    summaryData !== null &&
    'minimum' in summaryData
  );
};

interface SummariesManagerProps {
  initialData?: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  disabled?: boolean;
  readonly?: boolean;
}

const SummariesManager: React.FC<SummariesManagerProps> = ({
  initialData = {},
  onChange,
  disabled,
  readonly,
}) => {
  const [summaries, setSummaries] = useState(initialData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [suggestedKey, setSuggestedKey] = useState('new-summary');

  useEffect(() => {
    setSummaries(initialData);
  }, [initialData]);

  const handleShowModal = () => {
    const baseKey = 'new-summary';
    let counter = 1;
    let key = `${baseKey}`;
    while (summaries && summaries.hasOwnProperty(key)) {
      key = `${baseKey}-${counter++}`;
    }
    setSuggestedKey(key);
    setIsModalVisible(true);
  };

  const handleAddSummary = ({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }) => {
    if (!key || (summaries && summaries.hasOwnProperty(key))) return;
    const newSummaries = { ...summaries, [key]: value };
    setSummaries(newSummaries);
    onChange(newSummaries);
    setIsModalVisible(false);
  };

  const handleRemoveSummary = (keyToRemove: string) => () => {
    const newSummaries = { ...summaries };
    delete newSummaries[keyToRemove];
    setSummaries(newSummaries);
    onChange(newSummaries);
  };

  const getSummaryType = (summaryData: unknown): string => {
    if (typeof summaryData === 'string') return SUMMARY_TYPES.JSON_SCHEMA;
    if (Array.isArray(summaryData)) return SUMMARY_TYPES.SET;
    if (isRangeSummary(summaryData)) return SUMMARY_TYPES.RANGE;
    return SUMMARY_TYPES.JSON_SCHEMA;
  };

  const renderSummaryData = (type: string, data: unknown) => {
    switch (type) {
      case SUMMARY_TYPES.SET:
        return (
          <div>
            {(data as unknown[]).map((v, i) => (
              <Tag key={i}>{String(v) || '(empty)'}</Tag>
            ))}
          </div>
        );
      case SUMMARY_TYPES.RANGE:
        const rangeData = (data as RangeSummary) || {};
        return (
          <Typography.Text>
            Minimum: {String(rangeData.minimum)}, Maximum:{' '}
            {String(rangeData.maximum)}
          </Typography.Text>
        );
      case SUMMARY_TYPES.JSON_SCHEMA:
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          return (
            <pre
              style={{
                margin: 0,
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
              }}
            >
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          );
        } catch {
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
              {String(data)}
            </pre>
          );
        }
      default:
        return null;
    }
  };

  return (
    <fieldset id="summaries_manager" style={{ marginTop: '24px' }}>
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        Summaries
      </Typography.Title>
      {Object.entries(summaries || {}).map(([key, summaryData]) => (
        <Card key={key} size="small" style={{ marginBottom: '16px' }}>
          <Row align="top" gutter={8}>
            <Col flex="auto">
              <Typography.Text strong>{key}</Typography.Text>
              <div style={{ marginTop: '10px' }}>
                {renderSummaryData(getSummaryType(summaryData), summaryData)}
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
                  aria-label={`delete summary ${key}`}
                />
              </Tooltip>
            </Col>
          </Row>
        </Card>
      ))}
      <Row justify="end" style={{ marginTop: 16 }}>
        <Col>
          <Tooltip title="Add Summary">
            <Button
              type="dashed"
              icon={<PlusCircleOutlined />}
              onClick={handleShowModal}
              disabled={disabled || readonly}
            >
              Add Summary
            </Button>
          </Tooltip>
        </Col>
      </Row>
      <Modal
        title="Add New Summary"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
        footer={null} // The form now has its own buttons
      >
        {isModalVisible && (
          <AddSummaryForm
            initialKey={suggestedKey}
            onAdd={handleAddSummary}
            onCancel={() => setIsModalVisible(false)}
          />
        )}
      </Modal>
    </fieldset>
  );
};

export default SummariesManager;
