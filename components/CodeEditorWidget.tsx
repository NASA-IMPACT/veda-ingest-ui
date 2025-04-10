import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import CodeEditor from '@uiw/react-textarea-code-editor';

interface CodeEditorWidgetProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeEditorWidget: React.FC<CodeEditorWidgetProps> = ({
  value,
  onChange,
}) => {
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 300),
    [onChange]
  );

  const handleEditorChange = (newValue: string) => {
    setEditorValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <CodeEditor
      value={editorValue}
      language="json"
      onChange={(evn) => handleEditorChange(evn.target.value)}
      padding={15}
      style={{
        fontSize: 14,
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily:
          'ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
        boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.2)',
        borderRadius: '6px',
      }}
      className="lightJSONEditor"
    />
  );
};

export default CodeEditorWidget;
