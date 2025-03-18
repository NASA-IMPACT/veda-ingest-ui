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

  if (additionalProperties && style === 'warning') {
    return (
      <Card
        data-testid="extra-properties-card"
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: token.colorWarningText,
            }}
          >
            <ExclamationCircleOutlined />
            <span>Extra Properties set via JSON Editor</span>
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
            gridTemplateRows: 'repeat(3, auto)', // 3 rows before wrapping to new column
            gridAutoFlow: 'column',
            gap: '10px',
            padding: 0,
            listStyleType: 'none',
          }}
        >
          {additionalProperties.map((prop) => (
            <li key={prop} style={{ paddingLeft: '10px' }}>
              <Typography.Text
                style={{ color: token.colorWarningText, fontSize: '16px' }}
              >
                {prop}
              </Typography.Text>
            </li>
          ))}
        </ul>
      </Card>
    );
  } else if (additionalProperties && style === 'error') {
    return (
      <Card
        data-testid="extra-properties-card"
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: token.colorError,
            }}
          >
            <CloseCircleOutlined />
            <span>Schema Validation Errors</span>
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
            gridTemplateRows: 'repeat(3, auto)', // 3 rows before wrapping to new column
            gridAutoFlow: 'column',
            gap: '10px',
            padding: 0,
            listStyleType: 'none',
          }}
        >
          {additionalProperties.map((prop) => (
            <li key={prop} style={{ paddingLeft: '10px' }}>
              <Typography.Text
                style={{ color: token.colorErrorText, fontSize: '16px' }}
              >
                {prop}
              </Typography.Text>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
}

export default AdditionalPropertyCard;
