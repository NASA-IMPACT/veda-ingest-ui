// src/components/ExtensionManager.tsx
import React, { useState } from 'react';
import {
  Input,
  Button,
  List,
  Tag,
  Alert,
  Spin,
  Typography,
  Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ExtensionManagerProps {
  urls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (index: number) => void;
}

const ExtensionManager: React.FC<ExtensionManagerProps> = ({
  urls,
  onAddUrl,
  onRemoveUrl,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAdd = () => {
    if (!currentUrl.trim()) {
      setError('URL cannot be empty.');
      return;
    }
    // Basic URL validation
    try {
      new URL(currentUrl);
    } catch (_) {
      setError('Please enter a valid URL.');
      return;
    }

    setError('');
    onAddUrl(currentUrl);
    setCurrentUrl(''); // Clear input on success
  };

  return (
    <div
      style={{
        marginBottom: '24px',
        border: '1px solid #d9d9d9',
        padding: '16px',
        borderRadius: '8px',
      }}
    >
      <Text strong>STAC Extensions</Text>
      <Input.Group compact style={{ display: 'flex', marginTop: 16 }}>
        <Input
          style={{ flex: 1 }}
          placeholder="https://stac-extensions.github.io/datacube/v2.2.0/schema.json"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          onPressEnter={handleAdd}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add
        </Button>
      </Input.Group>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: '10px' }}
        />
      )}

      {urls.length > 0 && (
        <List
          style={{ marginTop: '16px' }}
          header={<div>Added Extensions</div>}
          bordered
          dataSource={urls}
          renderItem={(url, index) => (
            <List.Item
              actions={[
                <Tooltip title="Remove URL" key="remove">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveUrl(index)}
                  />
                </Tooltip>,
              ]}
            >
              <Typography.Text copyable={{ text: url }}>
                <Tag color="cyan">
                  {url.substring(url.lastIndexOf('/') + 1)}
                </Tag>
              </Typography.Text>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ExtensionManager;
