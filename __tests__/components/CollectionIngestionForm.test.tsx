import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import CollectionIngestionForm from '@/components/ingestion/CollectionIngestionForm';
import { useStacExtensions } from '@/hooks/useStacExtensions';
import { useTenants } from '@/hooks/useTenants';

// --- Mocks ---
vi.mock('@/hooks/useStacExtensions');
vi.mock('@/hooks/useTenants');

vi.mock('@/components/ui/ExtensionManager', () => ({
  default: ({ onAddExtension }: any) => (
    <div data-testid="extension-manager">
      <button
        onClick={() => onAddExtension('http://example.com/datacube.json')}
      >
        Add Extension
      </button>
    </div>
  ),
}));
vi.mock('@/components/ui/CodeEditorWidget', () => ({
  default: ({ id, value, onChange }: any) => (
    <textarea
      id={id}
      data-testid="code-editor-widget"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock('@rjsf/core', () => ({
  withTheme: () =>
    vi.fn(({ formData, children }) => (
      <div data-testid="rjsf-form">
        <div data-testid="rjsf-formdata">{JSON.stringify(formData)}</div>
        {children}
      </div>
    )),
}));
vi.mock('@/components/ui/JSONEditor', () => ({
  default: () => <div data-testid="json-editor" />,
}));
vi.mock('@/components/rjsf-components/SummariesManager', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="summaries-manager">
      <button onClick={() => onChange({ a: 1 })}>
        Simulate Summaries Change
      </button>
    </div>
  ),
}));
vi.mock('@/components/rjsf-components/AdditionalPropertyCard', () => ({
  default: () => <div data-testid="additional-property-card" />,
}));
vi.mock('@/utils/CustomValidation', () => ({ customValidate: vi.fn() }));
vi.mock('@/utils/ObjectFieldTemplate', () => ({ default: () => <div /> }));
vi.mock('@/FormSchemas/collections/collectionSchema.json', () => ({
  default: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summaries: { type: 'object' },
      stac_extensions: { type: 'array' },
      tenants: {
        type: 'array',
        title: 'Tenants',
        items: { type: 'string' },
        uniqueItems: true,
      },
    },
  },
}));
vi.mock('@/FormSchemas/collections/uischema.json', () => ({ default: {} }));

interface TestWrapperProps {
  initialFormData?: Record<string, any>;
  mockExtensionFields?: Record<string, any>;
  children?: React.ReactNode;
}

describe('CollectionIngestionForm', () => {
  const mockOnSubmit = vi.fn();
  let mockAddExtension: ReturnType<typeof vi.fn>;
  let mockRemoveExtension: ReturnType<typeof vi.fn>;

  const mockedSchemaForTests = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summaries: { type: 'object' },
      stac_extensions: { type: 'array' },
      tenants: {
        type: 'array',
        title: 'Tenants',
        items: { type: 'string' },
        uniqueItems: true,
      },
    },
  };

  const TestWrapper = ({
    initialFormData = {},
    mockExtensionFields = {},
    children,
  }: TestWrapperProps) => {
    const [formData, setFormData] = useState(initialFormData);

    (useStacExtensions as any).mockReturnValue({
      extensionFields: mockExtensionFields,
      addExtension: mockAddExtension,
      removeExtension: mockRemoveExtension,
      isLoading: false,
    });

    return (
      <CollectionIngestionForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={mockOnSubmit}
      >
        {children}
      </CollectionIngestionForm>
    );
  };

  beforeEach(() => {
    mockAddExtension = vi.fn();
    mockRemoveExtension = vi.fn();
    (useStacExtensions as any).mockReturnValue({
      extensionFields: {},
      addExtension: mockAddExtension,
      removeExtension: mockRemoveExtension,
      isLoading: false,
    });

    (useTenants as any).mockReturnValue({
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
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders core components correctly', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('extension-manager')).toBeVisible();
    expect(screen.getByTestId('rjsf-form')).toBeVisible();
    expect(screen.getByTestId('summaries-manager')).toBeVisible();
  });

  it('renders extension fields when provided by the hook', () => {
    const mockExtensionData = {
      'http://example.com/datacube.json': {
        title: 'Datacube',
        fields: [
          { name: 'cube:dimensions', required: true },
          { name: 'cube:variables', required: false },
        ],
      },
    };
    render(<TestWrapper mockExtensionFields={mockExtensionData} />);

    expect(screen.getByText('Datacube Fields')).toBeVisible();
    expect(screen.getByText('cube:dimensions')).toBeVisible();
    expect(screen.getByText('cube:variables')).toBeVisible();
  });

  it('calls addExtension from the hook when simulated', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const addButton = screen.getByRole('button', { name: 'Add Extension' });
    await user.click(addButton);
    expect(mockAddExtension).toHaveBeenCalledWith(
      'http://example.com/datacube.json'
    );
  });

  it('updates form data when an Extension field value changes', async () => {
    const user = userEvent.setup();
    const mockExtensionData = {
      'http://example.com/datacube.json': {
        title: 'Datacube',
        fields: [{ name: 'cube:dimensions', required: false }],
      },
    };
    const initialData = {
      title: 'Initial Title',
      summaries: {},
      'cube:dimensions': { original: 'value' },
    };

    render(
      <TestWrapper
        initialFormData={initialData}
        mockExtensionFields={mockExtensionData}
      >
        <button type="submit">Submit</button>
      </TestWrapper>
    );

    const codeEditor = screen.getByTestId('code-editor-widget');
    const newValue = { updated: true };
    fireEvent.change(codeEditor, {
      target: { value: JSON.stringify(newValue) },
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        ...initialData,
        'cube:dimensions': newValue,
      });
    });
  });

  it('updates form data when SummariesManager changes', async () => {
    const user = userEvent.setup();
    const initialData = {
      title: 'Initial Title',
      summaries: { initial: 'summary' },
    };
    render(
      <TestWrapper initialFormData={initialData}>
        <button type="submit">Submit</button>
      </TestWrapper>
    );

    const changeButton = screen.getByRole('button', {
      name: 'Simulate Summaries Change',
    });
    await user.click(changeButton);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Initial Title',
        summaries: { a: 1 },
      });
    });
  });

  it('correctly separates additional, base, and extension properties', () => {
    const mockExtensionData = {
      'http://example.com/datacube.json': {
        title: 'Datacube',
        fields: [{ name: 'cube:dimensions', required: true }],
      },
    };
    render(
      <TestWrapper
        initialFormData={{
          title: 'A Base Prop',
          'cube:dimensions': { some: 'data' },
          my_extra_prop: 'hello',
        }}
        mockExtensionFields={mockExtensionData}
      />
    );

    const rjsfFormData = JSON.parse(
      screen.getByTestId('rjsf-formdata').textContent || '{}'
    );
    expect(rjsfFormData.title).toBe('A Base Prop');
    expect(rjsfFormData['cube:dimensions']).toBeUndefined();

    expect(screen.getByText('cube:dimensions')).toBeVisible();
    expect(screen.getByTestId('additional-property-card')).toBeVisible();
  });

  it('combines all data sources on final submit', async () => {
    const user = userEvent.setup();
    const initialData = {
      title: 'Final Submit Test',
      summaries: { count: 50 },
      'cube:dimensions': { x: 'lat', y: 'lon' },
    };
    const mockExtensionData = {
      'http://example.com/datacube.json': {
        title: 'Datacube',
        fields: [{ name: 'cube:dimensions', required: false }],
      },
    };
    render(
      <TestWrapper
        initialFormData={initialData}
        mockExtensionFields={mockExtensionData}
      >
        <button type="submit">Submit</button>
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(initialData);
    });
  });
});
