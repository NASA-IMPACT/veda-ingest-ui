import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import dynamic from 'next/dynamic';
import { theme } from 'antd';
import '@uiw/react-textarea-code-editor/dist.css';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

const { useToken } = theme;

interface CodeEditorWidgetProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  id?: string;
}

const CodeEditorWidget: React.FC<CodeEditorWidgetProps> = ({
  value,
  onChange,
  id,
  readOnly = false,
}) => {
  const { token } = useToken();
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange?.(newValue);
    }, 300),
    [onChange]
  );

  const handleEditorChange = (newValue: string) => {
    setEditorValue(newValue);
    debouncedOnChange(newValue);
  };

  const baseStyle: React.CSSProperties = {
    fontSize: 14,
    fontFamily:
      'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
    boxShadow: token.boxShadow,
    borderRadius: token.borderRadius,
  };

  // Conditionally apply disabled styles using Ant Design tokens
  const dynamicStyle: React.CSSProperties = readOnly
    ? {
        ...baseStyle,
        backgroundColor: token.colorBgContainerDisabled,
        color: token.colorTextDisabled,
        cursor: 'not-allowed',
      }
    : {
        ...baseStyle,
        backgroundColor: token.colorBgElevated,
        color: token.colorText,
      };

  return (
    <CodeEditor
      value={editorValue}
      readOnly={readOnly}
      language="json"
      onChange={(evn) => handleEditorChange(evn.target.value)}
      padding={15}
      style={dynamicStyle}
      className="lightJSONEditor"
      id={id}
    />
  );
};

export default CodeEditorWidget;
