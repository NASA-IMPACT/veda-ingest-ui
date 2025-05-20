import { Card, theme, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import React, { forwardRef } from 'react';

const { useToken } = theme;

interface AdditionalPropertyCardProps {
  additionalProperties: string[] | null;
  style: 'warning' | 'error';
}

const AdditionalPropertyCard = forwardRef<
  HTMLDivElement,
  AdditionalPropertyCardProps
>(({ additionalProperties, style }, ref) => {
  const { token } = useToken();

  if (!additionalProperties) return null;

  const styleConfig = {
    warning: {
      title: 'Extra Properties set via JSON Editor',
      icon: <ExclamationCircleOutlined aria-hidden={true} />,
      textColor: token.colorWarning,
    },
    error: {
      title: 'Schema Validation Errors',
      icon: <CloseCircleOutlined aria-hidden={true} />,
      textColor: token.colorError,
    },
  };

  const { title, icon, textColor } = styleConfig[style];

  return (
    <Card
      ref={ref}
      data-testid="extra-properties-card"
      tabIndex={-1}
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: textColor,
          }}
        >
          {icon}
          <span>
            <h3>{title}</h3>
          </span>
        </div>
      }
      style={{
        width: '100%',
        marginTop: '10px',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: '#f5f5f5',
        boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
      }}
    >
      <div aria-live="polite">
        <ul
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(3, auto)',
            gridAutoFlow: 'column',
            gap: '10px',
            padding: 0,
            listStyleType: 'none',
          }}
        >
          {additionalProperties.map((prop) => (
            <li key={prop} style={{ paddingLeft: '10px' }}>
              <Typography.Text style={{ color: textColor, fontSize: '16px' }}>
                {prop}
              </Typography.Text>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
});

AdditionalPropertyCard.displayName = 'AdditionalPropertyCard';

export default AdditionalPropertyCard;
