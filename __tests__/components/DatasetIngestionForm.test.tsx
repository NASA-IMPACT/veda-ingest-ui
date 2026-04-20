import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatasetIngestionForm from '@/components/ingestion/DatasetIngestionForm'; // Adjust path
import React, { useState } from 'react';
import { useTenants } from '@/hooks/useTenants';

const mockedEnv = vi.hoisted(() => ({
  DATASET_FORM_SCHEMA_PROFILE: 'default' as 'default' | 'disasters',
}));

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return {
    ...actual,
    get cfg() {
      return {
        ...actual.cfg,
        DATASET_FORM_SCHEMA_PROFILE: mockedEnv.DATASET_FORM_SCHEMA_PROFILE,
      };
    },
  };
});

type JsonEditorProps = {
  onChange: (value: Record<string, unknown>) => void;
};

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

// Mock RJSF's Form component to isolate our component's logic
vi.mock('@rjsf/core', () => {
  const MockRjsfForm = vi.fn(
    ({ schema, uiSchema, formData, children, onChange, onSubmit }) => (
      <form
        data-testid="rjsf-form"
        onSubmit={(e) => {
          e.preventDefault();
          // Pass the schema from the component to the mock for verification
          onSubmit({ formData: schema });
        }}
      >
        <div data-testid="rjsf-uischema">{JSON.stringify(uiSchema)}</div>
        <div data-testid="rjsf-schema">{JSON.stringify(schema)}</div>
        <div data-testid="rjsf-formdata">{JSON.stringify(formData)}</div>
        <button onClick={() => onChange({ formData: { changed: true } })}>
          Simulate Form Change
        </button>
        {children}
      </form>
    )
  );
  return {
    withTheme: () => MockRjsfForm,
  };
});

vi.mock('@/hooks/useTenants');

// Mock child components
vi.mock('@/components/ui/JSONEditor', () => ({
  default: ({ onChange }: JsonEditorProps) => (
    <div data-testid="json-editor">
      <button onClick={() => onChange({ collection: 'edited from json' })}>
        Simulate JSON Change
      </button>
    </div>
  ),
}));

vi.mock('@/components/rjsf-components/AdditionalPropertyCard', () => ({
  default: () => <div data-testid="additional-property-card" />,
}));

vi.mock('@/components/ui/CodeEditorWidget', () => ({
  default: ({ value, onChange }: CodeEditorProps) => (
    <div data-testid="code-editor-widget">
      <textarea
        data-testid="code-editor-textarea"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}));

// Mock utils
vi.mock('@/utils/CustomValidation', () => ({
  customValidate: vi.fn((formData, errors) => errors),
}));
vi.mock('@/utils/FormHandlers', () => ({
  handleSubmit: vi.fn((data, onSubmit) => onSubmit(data.formData)),
}));
vi.mock('@/utils/ObjectFieldTemplate', () => ({
  default: () => <div data-testid="object-field-template" />,
}));

// Mock JSON schema imports
vi.mock('@/FormSchemas/datasets/datasetSchema.json', () => ({
  default: {
    type: 'object',
    properties: {
      collection: { type: 'string' },
      tenants: {
        type: 'array',
        title: 'Tenants',
        items: { type: 'string' },
        uniqueItems: true,
      },
    },
  },
}));
vi.mock('@/FormSchemas/datasets/uischema.json', () => ({
  default: { collection: { 'ui:widget': 'text' } },
}));
vi.mock('@/FormSchemas/disasters/datasetSchema.json', () => ({
  default: {
    type: 'object',
    properties: {
      disaster_only: { type: 'boolean' },
    },
  },
}));
vi.mock('@/FormSchemas/disasters/uischema.json', () => ({
  default: {
    disaster_only: { 'ui:widget': 'checkbox' },
  },
}));

describe('DatasetIngestionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockSetDisabled = vi.fn();
  let defaultProps: Omit<
    React.ComponentProps<typeof DatasetIngestionForm>,
    'formData' | 'setFormData'
  >;

  const mockedSchemaForTests = {
    type: 'object',
    properties: {
      collection: { type: 'string' },
      tenants: {
        type: 'array',
        title: 'Tenants',
        items: { type: 'string' },
        uniqueItems: true,
      },
    },
  };

  beforeEach(() => {
    mockedEnv.DATASET_FORM_SCHEMA_PROFILE = 'default';
    defaultProps = {
      onSubmit: mockOnSubmit,
      setDisabled: mockSetDisabled,
      isEditMode: false,
      children: <button type="submit">Submit Form</button>,
      defaultTemporalExtent: false,
      disableCollectionNameChange: false,
    };

    vi.mocked(useTenants).mockReturnValue({
      schema: {
        ...mockedSchemaForTests,
        properties: {
          ...mockedSchemaForTests.properties,
          tenants: {
            ...mockedSchemaForTests.properties.tenants,
            items: {
              ...mockedSchemaForTests.properties.tenants.items,
              enum: ['mockTenant1', 'mockTenant2'],
            },
          },
        },
      },
      isLoading: false,
    } as ReturnType<typeof useTenants>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders the RJSF form by default and renders children', () => {
    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );
    expect(screen.getByTestId('rjsf-form')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Form' })
    ).toBeInTheDocument();
  });

  it('sets a default temporal_extent when defaultTemporalExtent is true', async () => {
    const fixedDate = new Date('2025-06-16T12:00:00.000Z');
    vi.setSystemTime(fixedDate);
    const mockSetFormData = vi.fn();

    render(
      <DatasetIngestionForm
        {...defaultProps}
        defaultTemporalExtent={true}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );

    await waitFor(() => {
      expect(mockSetFormData).toHaveBeenCalledTimes(1);
    });

    const updaterFn = mockSetFormData.mock.calls[0][0];
    const previousState = { collection: 'initial' };
    const newState = updaterFn(previousState);

    expect(newState.temporal_extent).toEqual({
      startdate: '2025-06-16T00:00:00.000Z',
      enddate: '2025-06-16T23:59:59.000Z',
    });

    vi.useRealTimers();
  });

  it('calls setFormData and setDisabled on form change', async () => {
    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{}}
        setFormData={mockSetFormData}
      />
    );
    const changeButton = screen.getByRole('button', {
      name: 'Simulate Form Change',
    });
    await userEvent.click(changeButton);

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({ changed: true })
    );
    expect(mockSetDisabled).toHaveBeenCalledWith(false);
  });

  it('calls onSubmit handler when the form is submitted', async () => {
    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );
    const submitButton = screen.getByRole('button', { name: 'Submit Form' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Check that the schema passed to the mock RJSF form has the tenant enum
      const submittedSchema = mockOnSubmit.mock.calls[0][0];
      expect(submittedSchema.properties.tenants.items.enum).toEqual([
        'mockTenant1',
        'mockTenant2',
      ]);
    });
  });

  it('strips renders when submitted as an empty array', async () => {
    vi.mocked(useTenants).mockReturnValueOnce({
      schema: {
        ...mockedSchemaForTests,
        renders: [],
      },
      isLoading: false,
    } as ReturnType<typeof useTenants>);

    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Submit Form' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const submittedPayload = mockOnSubmit.mock.calls[0][0];
      expect(submittedPayload.renders).toBeUndefined();
    });
  });

  it('switches to the JSON editor tab and handles changes', async () => {
    const TestWrapper = () => {
      const [formData, setFormData] = useState<Record<string, unknown>>({
        collection: 'initial',
      });
      return (
        <DatasetIngestionForm
          {...defaultProps}
          formData={formData}
          setFormData={setFormData}
        />
      );
    };
    render(<TestWrapper />);

    const rjsfForm = screen.getByTestId('rjsf-form');
    expect(rjsfForm).toBeVisible();

    const jsonTab = screen.getByRole('tab', { name: 'Manual JSON Edit' });
    await userEvent.click(jsonTab);

    const jsonEditor = await screen.findByTestId('json-editor');
    expect(jsonEditor).toBeVisible();
    expect(rjsfForm).not.toBeVisible();

    const changeButton = screen.getByRole('button', {
      name: 'Simulate JSON Change',
    });
    await userEvent.click(changeButton);

    await waitFor(() => {
      const newRjsfForm = screen.getByTestId('rjsf-form');
      expect(newRjsfForm).toBeVisible();

      const schemaInRjsf = JSON.parse(
        screen.getByTestId('rjsf-schema').textContent || '{}'
      );
      expect(schemaInRjsf.properties.tenants.items.enum).toEqual([
        'mockTenant1',
        'mockTenant2',
      ]);
    });
  });

  it('enables submit button when changes are made in JSON Editor', async () => {
    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );

    const jsonTab = screen.getByRole('tab', { name: 'Manual JSON Edit' });
    await userEvent.click(jsonTab);

    // Simulate making a change in the JSON Editor
    const changeButton = screen.getByRole('button', {
      name: 'Simulate JSON Change',
    });
    await userEvent.click(changeButton);

    // Verify that setDisabled(false) was called to enable the submit button
    expect(mockSetDisabled).toHaveBeenCalledWith(false);
  });

  it('uses the locked UI schema when isEditMode is true', () => {
    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        isEditMode={true}
        formData={{}}
        setFormData={mockSetFormData}
      />
    );
    const uiSchemaDiv = screen.getByTestId('rjsf-uischema');
    const uiSchema = JSON.parse(uiSchemaDiv.textContent || '{}');
    expect(uiSchema.collection['ui:readonly']).toBe(true);
  });

  it('does not inject default item_assets for default profile on new forms', async () => {
    mockedEnv.DATASET_FORM_SCHEMA_PROFILE = 'default';
    const mockSetFormData = vi.fn();

    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{}}
        setFormData={mockSetFormData}
      />
    );

    await waitFor(() => {
      expect(mockSetFormData).toHaveBeenCalled();
    });

    const updaterFn = mockSetFormData.mock.calls[0][0];
    const newState = updaterFn({});

    expect(newState.item_assets).toBeUndefined();
  });

  it('does not inject default item_assets for disasters profile on new forms', async () => {
    mockedEnv.DATASET_FORM_SCHEMA_PROFILE = 'disasters';
    const mockSetFormData = vi.fn();

    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{}}
        setFormData={mockSetFormData}
      />
    );

    await waitFor(() => {
      expect(mockSetFormData).toHaveBeenCalled();
    });

    const updaterFn = mockSetFormData.mock.calls[0][0];
    const newState = updaterFn({});

    expect(newState.item_assets).toBeUndefined();
  });

  it('correctly handles nested dashboard objects in form rendering', () => {
    const mockSetFormData = vi.fn();
    const formDataWithDashboard = {
      collection: 'test',
      renders: {
        dashboard: {
          data: { foo: 'bar', nested: { key: 'value' } },
        },
      },
    };

    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={formDataWithDashboard}
        setFormData={mockSetFormData}
      />
    );

    expect(screen.getByTestId('rjsf-form')).toBeInTheDocument();

    const formDataDiv = screen.getByTestId('rjsf-formdata');
    const displayedFormData = JSON.parse(formDataDiv.textContent || '{}');

    expect(displayedFormData.renders?.dashboard).toEqual({
      data: { foo: 'bar', nested: { key: 'value' } },
    });

    // Verify it's not showing '[object Object]'
    expect(formDataDiv.textContent).not.toContain('[object Object]');
  });

  it('selects schema source from env profile before tenant injection', () => {
    mockedEnv.DATASET_FORM_SCHEMA_PROFILE = 'disasters';

    vi.mocked(useTenants).mockReturnValueOnce({
      schema: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          discovery_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                bucket: { type: 'string' },
              },
            },
          },
        },
      },
      uiSchema: {
        discovery_items: {
          items: {
            bucket: {
              'ui:widget': 'text',
            },
            'ui:grid': [{ bucket: 24 }],
          },
        },
      },
      isLoading: false,
    } as ReturnType<typeof useTenants>);

    const mockSetFormData = vi.fn();
    render(
      <DatasetIngestionForm
        {...defaultProps}
        formData={{ collection: 'initial' }}
        setFormData={mockSetFormData}
      />
    );

    const renderedSchema = JSON.parse(
      screen.getByTestId('rjsf-schema').textContent || '{}'
    );

    expect(useTenants).toHaveBeenCalledWith(
      {
        type: 'object',
        properties: {
          disaster_only: { type: 'boolean' },
        },
      },
      {
        disaster_only: { 'ui:widget': 'checkbox' },
      }
    );

    expect(
      renderedSchema.properties.discovery_items.items.properties.bucket
    ).toEqual({
      type: 'string',
    });
  });
});
