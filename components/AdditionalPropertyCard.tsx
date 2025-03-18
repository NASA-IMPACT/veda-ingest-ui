import { Card, theme, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { useToken } = theme;

function AdditionalPropertyCard({
  additionalProperties,
  style,
}: {
  additionalProperties: string[] | null;
  style: 'warning' | 'error';
}) {
  const { token } = useToken();

  if (!additionalProperties) return null;

  const styleConfig = {
    warning: {
      title: 'Extra Properties set via JSON Editor',
      icon: <ExclamationCircleOutlined />,
      textColor: token.colorWarningText,
    },
    error: {
      title: 'Schema Validation Errors',
      icon: <CloseCircleOutlined />,
      textColor: token.colorErrorText,
    },
  };

  const { title, icon, textColor } = styleConfig[style];

  return (
    <Card
      data-testid="extra-properties-card"
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
          <span>{title}</span>
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
    </Card>
  );
}

export default AdditionalPropertyCard;
