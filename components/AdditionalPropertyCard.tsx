import { Card, theme, Typography, Divider, Tag, Space } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import React, { forwardRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-textarea-code-editor/dist.css';

// Dynamically import the CodeEditor
const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

const { useToken } = theme;

interface AdditionalPropertyCardProps {
  additionalProperties: { [key: string]: any } | null;
  style: 'warning' | 'error';
}

const AdditionalPropertyCard = forwardRef<
  HTMLDivElement,
  AdditionalPropertyCardProps
>(({ additionalProperties, style }, ref) => {
  const { token } = useToken();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  if (!additionalProperties || Object.keys(additionalProperties).length === 0) {
    return null;
  }

  const topLevelKeys = Object.keys(additionalProperties);
  const hasSingleProperty = topLevelKeys.length === 1;

  const styleConfig = {
    warning: {
      title: 'Extra Properties set via JSON Editor',
      icon: <ExclamationCircleOutlined aria-hidden={true} />,
      textColor: token.colorWarningText,
      headerBgColor: token.colorWarningBg,
    },
    error: {
      title: 'Schema Validation Errors',
      icon: <CloseCircleOutlined aria-hidden={true} />,
      textColor: token.colorErrorText,
      headerBgColor: token.colorErrorBg,
    },
  };

  const { title, icon, textColor, headerBgColor } = styleConfig[style];

  const handleTagChange = (key: string, checked: boolean) => {
    setSelectedKey(checked ? key : null);
  };

  return (
    <Card
      ref={ref}
      data-testid="extra-properties-card"
      tabIndex={-1}
      styles={{
        header: {
          backgroundColor: headerBgColor,
          color: textColor,
          borderTopLeftRadius: token.borderRadiusLG,
          borderTopRightRadius: token.borderRadiusLG,
        },
        body: {
          padding: '12px 16px',
          maxHeight: '400px',
          overflowY: 'auto',
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <Typography.Title level={5} style={{ color: 'inherit', margin: 0 }}>
            {title}
          </Typography.Title>
        </div>
      }
      style={{
        width: '100%',
        marginTop: '10px',
        boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
      }}
    >
      {hasSingleProperty ? (
        // Render this view if there is only one property
        <div>
          <Typography.Text strong>Property Details:</Typography.Text>
          <Divider style={{ margin: '12px 0' }} />
          <CodeEditor
            readOnly
            value={JSON.stringify(additionalProperties, null, 2)}
            language="json"
            padding={15}
            style={{
              fontSize: 14,
              fontFamily:
                'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
              borderRadius: token.borderRadius,
              backgroundColor: token.colorFillQuaternary,
            }}
          />
        </div>
      ) : (
        // Render the interactive tag view if there are multiple properties
        <div>
          <Typography.Text strong>
            Top-Level Keys (click to view):
          </Typography.Text>
          <div style={{ marginTop: '8px' }}>
            <Space size={[0, 8]} wrap>
              {topLevelKeys.map((key) => (
                <Tag.CheckableTag
                  key={key}
                  checked={selectedKey === key}
                  onChange={(checked) => handleTagChange(key, checked)}
                >
                  {key}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          {selectedKey && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <CodeEditor
                readOnly
                value={JSON.stringify(
                  { [selectedKey]: additionalProperties[selectedKey] },
                  null,
                  2
                )}
                language="json"
                padding={15}
                style={{
                  fontSize: 14,
                  fontFamily:
                    'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
                  borderRadius: token.borderRadius,
                  backgroundColor: token.colorFillQuaternary,
                }}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
});

AdditionalPropertyCard.displayName = 'AdditionalPropertyCard';

export default AdditionalPropertyCard;
