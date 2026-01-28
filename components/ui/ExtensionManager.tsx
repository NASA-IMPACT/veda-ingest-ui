import React, { useState } from 'react';
import { Card, Input, Divider, Typography, Space, Tag, App } from 'antd';

interface ExtensionManagerProps {
  extensionFields: Record<string, { title: string }>;
  onAddExtension: (url: string) => void;
  onRemoveExtension: (url: string) => void;
  isLoading: boolean;
}

const ExtensionManager: React.FC<ExtensionManagerProps> = ({
  extensionFields,
  onAddExtension,
  onRemoveExtension,
  isLoading,
}) => {
  const { message } = App.useApp();
  const [searchUrl, setSearchUrl] = useState<string>('');

  const handleSearch = (value: string) => {
    if (value) {
      onAddExtension(value);
      setSearchUrl('');
    } else {
      message.error('Please enter a URL.');
    }
  };

  return (
    <Card title="STAC Extensions" style={{ marginBottom: '24px' }}>
      <Input.Search
        placeholder="Enter extension schema URL"
        enterButton="Add Extension"
        value={searchUrl}
        onChange={(e) => setSearchUrl(e.target.value)}
        onSearch={handleSearch}
        loading={isLoading}
      />
      {Object.keys(extensionFields).length > 0 && (
        <>
          <Divider />
          <Typography.Text>Loaded Extensions:</Typography.Text>
          <div style={{ marginTop: '8px' }}>
            <Space wrap>
              {Object.entries(extensionFields).map(([url, { title }]) => (
                <Tag key={url} closable onClose={() => onRemoveExtension(url)}>
                  {title}
                </Tag>
              ))}
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};

export default ExtensionManager;
