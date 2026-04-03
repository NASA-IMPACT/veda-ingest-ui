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

type ExtensionManagerProps = {
  onAddExtension: (extension: string) => void;
};

type CodeEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

type JsonEditorProps = {
  onChange: (data: Record<string, unknown>) => void;
  setHasJSONChanges: (value: boolean) => void;
  immutableFields?: Record<string, unknown>;
};

type SummariesManagerProps = {
  onChange: (value: Record<string, unknown>) => void;
  readonly?: boolean;
};

// --- Mocks ---
vi.mock('@/hooks/useStacExtensions');
vi.mock('@/hooks/useTenants');

vi.mock('@/components/ui/ExtensionManager', () => ({
  default: ({ onAddExtension }: ExtensionManagerProps) => (
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
  default: ({ id, value, onChange }: CodeEditorProps) => (
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
  default: ({
    onChange,
    setHasJSONChanges,
    immutableFields,
  }: JsonEditorProps) => (
    <div data-testid="json-editor">
      <div data-testid="json-editor-immutable-fields">
        {JSON.stringify(immutableFields || {})}
      </div>
      <button
        onClick={() => {
          setHasJSONChanges(true);
          onChange({
            id: 'test-id',
            title: 'JSON Updated Title',
            summaries: { mutated: true },
            links: [{ rel: 'about', href: 'https://mutated.example.com' }],
          });
        }}
      >
        Simulate JSON Change
      </button>
    </div>
  ),
}));
vi.mock('@/components/rjsf-components/SummariesManager', () => ({
  default: ({ onChange, readonly }: SummariesManagerProps) => (
    <div data-testid="summaries-manager">
      <div data-testid="summaries-manager-readonly">{String(readonly)}</div>
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
  initialFormData?: Record<string, unknown>;
  mockExtensionFields?: Record<string, unknown>;
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

    vi.mocked(useStacExtensions).mockReturnValue({
      extensionFields: mockExtensionFields,
      addExtension: mockAddExtension,
      removeExtension: mockRemoveExtension,
      isLoading: false,
    } as ReturnType<typeof useStacExtensions>);

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
    vi.mocked(useStacExtensions).mockReturnValue({
      extensionFields: {},
      addExtension: mockAddExtension,
      removeExtension: mockRemoveExtension,
      isLoading: false,
    } as ReturnType<typeof useStacExtensions>);

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

  it('validates required extension fields and shows errors', async () => {
    const mockExtensionData = {
      'http://example.com/datacube.json': {
        title: 'Datacube',
        fields: [{ name: 'cube:dimensions', required: true }],
      },
    };
    render(
      <TestWrapper
        initialFormData={{ title: 'Test' }}
        mockExtensionFields={mockExtensionData}
      >
        <button type="submit">Submit</button>
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Validation Errors')).toBeVisible();
      expect(
        screen.getByText(
          /Field 'cube:dimensions' is required and cannot be empty/
        )
      ).toBeVisible();
    });

    // onSubmit should not be called when validation fails
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('uses locked UI schema in edit mode', () => {
    const TestWrapperEditMode = () => {
      const [formData, setFormData] = useState<Record<string, unknown>>({
        id: 'test-id',
        title: 'Test',
      });

      vi.mocked(useStacExtensions).mockReturnValue({
        extensionFields: {},
        addExtension: mockAddExtension,
        removeExtension: mockRemoveExtension,
        isLoading: false,
      } as ReturnType<typeof useStacExtensions>);

      return (
        <CollectionIngestionForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={mockOnSubmit}
          isEditMode={true}
        />
      );
    };

    render(<TestWrapperEditMode />);

    expect(screen.getByTestId('rjsf-form')).toBeVisible();
  });

  it('sets summaries to readonly in existingCollection edit mode', () => {
    const TestWrapperExistingCollectionEditMode = () => {
      const [formData, setFormData] = useState<Record<string, unknown>>({
        id: 'test-id',
        title: 'Test',
      });

      vi.mocked(useStacExtensions).mockReturnValue({
        extensionFields: {},
        addExtension: mockAddExtension,
        removeExtension: mockRemoveExtension,
        isLoading: false,
      } as ReturnType<typeof useStacExtensions>);

      return (
        <CollectionIngestionForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={mockOnSubmit}
          isEditMode={true}
          formType="existingCollection"
        />
      );
    };

    render(<TestWrapperExistingCollectionEditMode />);

    expect(screen.getByTestId('summaries-manager-readonly')).toHaveTextContent(
      'true'
    );
  });

  it('prevents summaries and links mutation via JSON editor in existingCollection edit mode', async () => {
    const user = userEvent.setup();

    const TestWrapperExistingCollectionJsonEditMode = () => {
      const [formData, setFormData] = useState<Record<string, unknown>>({
        id: 'test-id',
        title: 'Original Title',
        summaries: { original: 'summary' },
        links: [{ rel: 'about', href: 'https://original.example.com' }],
      });

      vi.mocked(useStacExtensions).mockReturnValue({
        extensionFields: {},
        addExtension: mockAddExtension,
        removeExtension: mockRemoveExtension,
        isLoading: false,
      } as ReturnType<typeof useStacExtensions>);

      return (
        <CollectionIngestionForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={mockOnSubmit}
          isEditMode={true}
          formType="existingCollection"
        >
          <button type="submit">Submit</button>
        </CollectionIngestionForm>
      );
    };

    render(<TestWrapperExistingCollectionJsonEditMode />);
    await user.click(screen.getByRole('tab', { name: 'Manual JSON Edit' }));

    await waitFor(() => {
      const immutableFields = JSON.parse(
        screen.getByTestId('json-editor-immutable-fields').textContent || '{}'
      );
      expect(immutableFields).toMatchObject({
        summaries: {
          label: 'Summaries',
          value: { original: 'summary' },
        },
        links: {
          label: 'Links',
          value: [{ rel: 'about', href: 'https://original.example.com' }],
        },
      });
    });
  });
});
