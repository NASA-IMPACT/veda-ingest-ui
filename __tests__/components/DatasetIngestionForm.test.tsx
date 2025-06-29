import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatasetIngestionForm from '@/components/DatasetIngestionForm'; // Adjust path
import React, { useState } from 'react';

// Mock RJSF's Form component to isolate our component's logic
vi.mock('@rjsf/core', () => {
  const MockRjsfForm = vi.fn(
    ({ formData, uiSchema, children, onChange, onSubmit }) => (
      <form
        data-testid="rjsf-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ formData });
        }}
      >
        <div data-testid="rjsf-uischema">{JSON.stringify(uiSchema)}</div>
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

// Mock child components
vi.mock('@/components/JSONEditor', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="json-editor">
      <button onClick={() => onChange({ collection: 'edited from json' })}>
        Simulate JSON Change
      </button>
    </div>
  ),
}));

vi.mock('@/components/AdditionalPropertyCard', () => ({
  default: () => <div data-testid="additional-property-card" />,
}));

vi.mock('@/components/CodeEditorWidget', () => ({
  default: () => <div data-testid="code-editor-widget" />,
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
  default: { type: 'object', properties: { collection: { type: 'string' } } },
}));
vi.mock('@/FormSchemas/datasets/uischema.json', () => ({
  default: { collection: { 'ui:widget': 'text' } },
}));

describe('DatasetIngestionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockSetDisabled = vi.fn();
  let defaultProps: any;

  beforeEach(() => {
    defaultProps = {
      onSubmit: mockOnSubmit,
      setDisabled: mockSetDisabled,
      isEditMode: false,
      children: <button type="submit">Submit Form</button>,
      defaultTemporalExtent: false,
      disableCollectionNameChange: false,
    };
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

    expect(mockSetFormData).toHaveBeenCalledWith({ changed: true });
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
      expect(mockOnSubmit).toHaveBeenCalledWith({ collection: 'initial' });
    });
  });

  it('switches to the JSON editor tab and handles changes', async () => {
    const TestWrapper = () => {
      const [formData, setFormData] = useState({ collection: 'initial' });
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

      const formDataInRjsf = JSON.parse(
        screen.getByTestId('rjsf-formdata').textContent || '{}'
      );
      expect(formDataInRjsf.collection).toBe('edited from json');
    });
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
});
