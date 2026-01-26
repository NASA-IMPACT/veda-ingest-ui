import React, { useState, useEffect } from 'react';
import { Input, Button, Row, Col, Tooltip, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface EditableAssetRowProps {
  initialKey: string;
  index: number;
  onKeyChange: (oldKey: string, newKey: string) => void;
  onRemove: (keyToRemove: string) => () => void;
  disabled?: boolean;
  readonly?: boolean;
}
const EditableAssetRow: React.FC<EditableAssetRowProps> = ({
  initialKey,
  index,
  onKeyChange,
  onRemove,
  disabled,
  readonly,
}) => {
  const [inputValue, setInputValue] = useState(initialKey);

  useEffect(() => {
    setInputValue(initialKey);
  }, [initialKey]);

  const handleBlur = () => {
    onKeyChange(initialKey, inputValue);
  };

  return (
    <Row align="middle" gutter={8} wrap={false}>
      <Col flex="auto">
        <Space.Compact style={{ width: '100%' }}>
          <div
            style={{
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: '6px 0 0 6px',
              height: 32,
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            Asset #{index + 1}
          </div>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={`Asset key (e.g., thumbnail)`}
            disabled={disabled || readonly}
          />
        </Space.Compact>
      </Col>
      <Col flex="none">
        <Tooltip title="Remove Asset">
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={onRemove(initialKey)}
            disabled={disabled || readonly}
          />
        </Tooltip>
      </Col>
    </Row>
  );
};

export default EditableAssetRow;
