import { WidgetProps } from '@rjsf/utils';
import { Alert, Button, Divider, Typography } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';

import COGDrawerViewer from '@/components/COGViewer/COGDrawerViewer';
import CodeEditorWidget from '@/components/ui/CodeEditorWidget';

type FormContextWithSampleFiles = {
  formData?: {
    sample_files?: string[];
    renders?: {
      dashboard?: string;
    };
  };
};

const toEditorString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

export const RendersDashboardWidget = ({
  id,
  value,
  onChange,
  disabled,
  readonly,
  registry,
  formContext,
}: WidgetProps) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [cogDrawerOpen, setCOGDrawerOpen] = useState(false);
  const [drawerUrl, setDrawerUrl] = useState<string | null>(null);

  const editorValue = useMemo(() => toEditorString(value), [value]);
  // In RJSF v6, widgets should prefer registry.formContext; keep prop fallback.
  const context = (registry?.formContext || formContext) as
    | FormContextWithSampleFiles
    | undefined;
  const isDashboardField = id.endsWith('_dashboard');
  const hasSampleFiles =
    context?.formData?.sample_files && context.formData.sample_files.length > 0;

  const handleOpenCOGDrawer = () => {
    const sampleUrl = context?.formData?.sample_files?.[0];
    if (!sampleUrl) {
      setErrorMessage('Sample File URL is required');
      return;
    }

    setErrorMessage('');
    setDrawerUrl(sampleUrl);
    setCOGDrawerOpen(true);
  };

  const handleAcceptRenderOptions = (renderOptions: string) => {
    onChange(renderOptions);
  };

  const handleEditorChange = (newValue: string) => {
    setErrorMessage('');
    onChange(newValue);
  };

  return (
    <>
      <CodeEditorWidget
        id={id}
        value={editorValue}
        onChange={handleEditorChange}
        readOnly={!!(readonly || disabled)}
      />

      {isDashboardField && hasSampleFiles && (
        <>
          {errorMessage && (
            <Alert
              message={errorMessage}
              type="error"
              showIcon
              style={{ marginTop: '10px', marginBottom: '10px' }}
            />
          )}
          <Button
            type="primary"
            onClick={handleOpenCOGDrawer}
            icon={<ImportOutlined />}
            style={{ marginTop: '10px', marginBottom: '16px' }}
            disabled={readonly || disabled}
          >
            Generate Renders Object From Sample File
          </Button>
          <Divider style={{ margin: '0 0 16px 0' }} />
          <Typography.Text
            type="secondary"
            style={{ display: 'block', marginBottom: '8px' }}
          >
            Optional Additional Renders Objects
          </Typography.Text>
        </>
      )}

      <COGDrawerViewer
        drawerOpen={cogDrawerOpen}
        url={drawerUrl || ''}
        renders={typeof value === 'string' ? value : undefined}
        onClose={() => setCOGDrawerOpen(false)}
        onAcceptRenderOptions={handleAcceptRenderOptions}
      />
    </>
  );
};
