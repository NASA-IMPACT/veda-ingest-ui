import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollectionIngestionForm from '@/components/CollectionIngestionForm'; // Adjust path
import React, { useState } from 'react';

// --- Mocks ---

// Mock RJSF's Form component
vi.mock('@rjsf/core', () => {
  const MockRjsfForm = vi.fn(({ formData, children, onChange, onSubmit }) => (
    <form
      data-testid="rjsf-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ formData });
      }}
    >
      <div data-testid="rjsf-formdata">{JSON.stringify(formData)}</div>
      <button onClick={() => onChange({ formData: { title: 'New Title' } })}>
        Simulate Form Change
      </button>
      {children}
    </form>
  ));
  return {
    withTheme: () => MockRjsfForm,
  };
});

// Mock child components
vi.mock('@/components/JSONEditor', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="json-editor">
      <button
        onClick={() =>
          onChange({
            collection: 'edited from json',
            summaries: { new: 'summary' },
          })
        }
      >
        Simulate JSON Change
      </button>
    </div>
  ),
}));

vi.mock('@/components/SummariesManager', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="summaries-manager">
      <button onClick={() => onChange({ a: 1 })}>
        Simulate Summaries Change
      </button>
    </div>
  ),
}));

vi.mock('@/components/AdditionalPropertyCard', () => ({
  default: () => <div data-testid="additional-property-card" />,
}));

// Mock utils & fields since they are used by the form
vi.mock('@/utils/CustomValidation', () => ({ customValidate: vi.fn() }));
vi.mock('@/utils/ObjectFieldTemplate', () => ({ default: () => <div /> }));
vi.mock('@/utils/BboxField', () => ({ default: () => <div /> }));
vi.mock('@/utils/IntervalField', () => ({ default: () => <div /> }));
vi.mock('@/utils/AssetsField', () => ({ default: () => <div /> }));

// Mock schema imports
vi.mock('@/FormSchemas/collections/collectionSchema.json', () => ({
  default: {
    type: 'object',
    properties: { title: { type: 'string' }, summaries: { type: 'object' } },
  },
}));
vi.mock('@/FormSchemas/collections/uischema.json', () => ({ default: {} }));

describe('CollectionIngestionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockSetDisabled = vi.fn();
  let defaultProps: any;

  // Use a stateful wrapper to mimic how the parent component would manage state
  const TestWrapper = (props: any) => {
    const [formData, setFormData] = useState({
      title: 'Initial Title',
      summaries: { initial: 'summary' },
    });
    return (
      <CollectionIngestionForm
        {...defaultProps}
        {...props}
        formData={formData}
        setFormData={setFormData}
      />
    );
  };

  beforeEach(() => {
    defaultProps = {
      onSubmit: mockOnSubmit,
      setDisabled: mockSetDisabled,
      children: <button type="submit">Submit Form</button>,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders the RJSF form and SummariesManager by default', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('rjsf-form')).toBeInTheDocument();
    expect(screen.getByTestId('summaries-manager')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Form' })
    ).toBeInTheDocument();
  });

  it('separates summaries from the data passed to the RJSF form', () => {
    render(<TestWrapper />);
    const rjsfFormData = JSON.parse(
      screen.getByTestId('rjsf-formdata').textContent || '{}'
    );
    expect(rjsfFormData.title).toBe('Initial Title');
    expect(rjsfFormData.summaries).toBeUndefined();
  });

  it('updates form data and re-merges summaries when RJSF form changes', async () => {
    render(<TestWrapper />);
    const changeButton = screen.getByRole('button', {
      name: 'Simulate Form Change',
    });
    await userEvent.click(changeButton);

    await waitFor(() => {
      const rjsfFormData = JSON.parse(
        screen.getByTestId('rjsf-formdata').textContent || '{}'
      );
      // It now reflects the change from the RJSF form
      expect(rjsfFormData.title).toBe('New Title');
      // But it still doesn't have the summaries data directly
      expect(rjsfFormData.summaries).toBeUndefined();
    });
    // The disabled prop function should be called
    expect(mockSetDisabled).toHaveBeenCalledWith(false);
  });

  it('updates form data when SummariesManager changes', async () => {
    render(<TestWrapper />);
    const changeButton = screen.getByRole('button', {
      name: 'Simulate Summaries Change',
    });
    await userEvent.click(changeButton);

    await waitFor(() => {
      // The data passed to the RJSF form should still only contain the RJSF-specific fields
      const rjsfFormData = JSON.parse(
        screen.getByTestId('rjsf-formdata').textContent || '{}'
      );
      expect(rjsfFormData.title).toBe('Initial Title'); // Unchanged
    });
  });

  it('combines RJSF data and summaries data on final submit', async () => {
    render(<TestWrapper />);
    const submitButton = screen.getByRole('button', { name: 'Submit Form' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Initial Title', // From RJSF part of the state
        summaries: { initial: 'summary' }, // From the separate summaries state
      });
    });
  });

  it('switches to JSON editor tab and updates all data on change', async () => {
    render(<TestWrapper />);

    // Switch to JSON tab
    const jsonTab = screen.getByRole('tab', { name: 'Manual JSON Edit' });
    await userEvent.click(jsonTab);

    // Check that JSON editor is now visible
    const jsonEditor = await screen.findByTestId('json-editor');
    expect(jsonEditor).toBeVisible();
    expect(screen.getByTestId('rjsf-form')).not.toBeVisible();

    // Simulate a change in the JSON editor
    const changeButton = screen.getByRole('button', {
      name: 'Simulate JSON Change',
    });
    await userEvent.click(changeButton);

    await waitFor(() => {
      const newRjsfForm = screen.getByTestId('rjsf-form');
      expect(newRjsfForm).toBeVisible();

      const rjsfFormData = JSON.parse(
        screen.getByTestId('rjsf-formdata').textContent || '{}'
      );
      expect(rjsfFormData.collection).toBe('edited from json');
      // The `summaries` key should be gone from the RJSF data, as it's managed separately
      expect(rjsfFormData.summaries).toBeUndefined();
    });
  });
});
