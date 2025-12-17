import { WidgetProps } from '@rjsf/utils';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Typography from 'antd/lib/typography';
import { useState, useEffect, useRef } from 'react';
import { CheckOutlined, CloseCircleOutlined } from '@ant-design/icons';

type ValidationState = 'idle' | 'loading' | 'validated' | 'error';

export const TestableUrlWidget = ({
  id,
  value,
  onChange,
  disabled,
  readonly,
}: WidgetProps) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [validationState, setValidationState] =
    useState<ValidationState>('idle');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // This effect syncs the local state if the form data is changed from elsewhere
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
    // When the value changes externally, reset the validation state
    setValidationState('idle');
  }, [value]);

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const handleValidationClick = async () => {
    if (!inputValue) return;

    setValidationState('loading');
    const encodedUrl = encodeURIComponent(inputValue);
    const validationApiUrl = `https://staging.openveda.cloud/api/raster/cog/validate?strict=false&url=${encodedUrl}`;

    try {
      const response = await fetch(validationApiUrl);
      if (response.ok) {
        setValidationState('validated');
      } else {
        setValidationState('error');
      }
    } catch (err) {
      console.error('Validation API request failed', err);
      setValidationState('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValidationState('idle');

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      onChange(newValue === '' ? undefined : newValue);
    }, 400);
  };

  const getButtonText = () => {
    switch (validationState) {
      case 'loading':
        return 'Validating';
      case 'validated':
        return 'Validated';
      case 'error':
        return 'Invalid';
      case 'idle':
      default:
        return 'Validate';
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
        }}
      >
        <Input
          value={inputValue}
          onChange={handleInputChange}
          id={id}
          disabled={disabled}
          readOnly={readonly}
          style={{ flex: 1 }}
        />
        <Button
          onClick={handleValidationClick}
          disabled={
            disabled || readonly || !inputValue || validationState === 'loading'
          }
          loading={validationState === 'loading'}
          icon={
            validationState === 'validated' ? (
              <CheckOutlined />
            ) : validationState === 'error' ? (
              <CloseCircleOutlined />
            ) : null
          }
          danger={validationState === 'error'}
          type={validationState === 'validated' ? 'primary' : 'default'}
          ghost={validationState === 'validated'}
          style={{ width: '120px' }}
        >
          {getButtonText()}
        </Button>
      </div>
      {validationState === 'error' && (
        <Typography.Text
          type="danger"
          style={{ marginTop: '4px', display: 'block' }}
        >
          Validation failed. The URL may be invalid or unreachable.
        </Typography.Text>
      )}
    </div>
  );
};
