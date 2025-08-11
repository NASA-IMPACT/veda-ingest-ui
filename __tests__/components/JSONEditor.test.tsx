import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JSONEditor from '@/components/ui/JSONEditor';
import { message } from 'antd';
import type { MessageType } from 'antd/es/message/interface';
import React from 'react';

// --- JSDOM Workaround for Ant Design ---
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

vi.mock('next/dynamic', async () => {
  const CodeEditorModule = await vi.importActual<
    typeof import('@uiw/react-textarea-code-editor')
  >('@uiw/react-textarea-code-editor');
  return {
    // eslint-disable-next-line react/display-name
    default: () => CodeEditorModule.default,
  };
});

// Mock the AdditionalPropertyCard component
vi.mock('@/components/rjsf-components/AdditionalPropertyCard', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const MockCard = React.forwardRef<
    HTMLDivElement,
    { additionalProperties: any; style: string }
  >(({ additionalProperties, style }, ref) => (
    <div
      ref={ref}
      data-testid="mock-additional-property-card"
      data-style={style}
    >
      <pre>{JSON.stringify(additionalProperties)}</pre>
    </div>
  ));
  MockCard.displayName = 'MockAdditionalPropertyCard';
  return {
    default: MockCard,
  };
});

// Mock Ant Design's Modal Component
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();

  function MockModal({ open, title, children, footer, onCancel }: any) {
    if (!open) return null;
    return (
      <div role="dialog" data-testid="mock-modal-overlay">
        <h2 data-testid="mock-modal-title">{title}</h2>
        <div>{children}</div>
        {footer && (
          <div>
            {footer.map((button: any, index: number) => (
              <button key={index} onClick={button.props.onClick}>
                {button.props.children}
              </button>
            ))}
          </div>
        )}
        <button onClick={onCancel} data-testid="mock-modal-close-button">
          Cancel
        </button>
      </div>
    );
  }
  MockModal.displayName = 'MockAntdModal';

  return {
    ...antd,
    Modal: MockModal,
  };
});

vi.spyOn(message, 'error').mockImplementation(() => ({}) as MessageType);

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

// --- Mock Data & Schema ---
const mockFormData = {
  id: 'initial-id-123',
  collection: 'test-collection',
  renders: { dashboard: JSON.stringify({ json: true }) },
  temporal_extent: {
    startdate: '2025-02-07T00:00:00.000Z',
    enddate: '2025-02-07T23:59:59.000Z',
  },
  stac_version: '1.0.0',
};

const mockJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    collection: { type: 'string' },
    stac_version: { type: 'string' },
    renders: {
      type: 'object',
      properties: { dashboard: { type: 'string' } },
    },
    temporal_extent: {
      type: 'object',
      properties: {
        startdate: { type: 'string', format: 'date-time' },
        enddate: { type: 'string', format: 'date-time' },
      },
    },
    'dashboard:is_periodic': { type: 'boolean' },
    'dashboard:time_density': { type: 'string' },
  },
  additionalProperties: false,
};

describe('JSONEditor', () => {
  let mockOnChange: Mock;
  let mockSetHasJSONChanges: Mock;
  let mockSetAdditionalProperties: Mock;
  let defaultProps: any;

  beforeEach(() => {
    mockOnChange = vi.fn();
    mockSetHasJSONChanges = vi.fn();
    mockSetAdditionalProperties = vi.fn();
    defaultProps = {
      value: structuredClone(mockFormData),
      jsonSchema: structuredClone(mockJsonSchema),
      onChange: mockOnChange,
      disableIdChange: false,
      disableCollectionNameChange: false,
      hasJSONChanges: true,
      setHasJSONChanges: mockSetHasJSONChanges,
      additionalProperties: null,
      setAdditionalProperties: mockSetAdditionalProperties,
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderEditor = async (props: any) => {
    render(<JSONEditor {...props} />);
    return await screen.findByTestId('json-editor');
  };

  const updateEditorValue = (textarea: HTMLElement, content: string) => {
    fireEvent.change(textarea, { target: { value: content } });
  };

  it("converts 'renders.dashboard' from an object to a pretty JSON string before saving", async () => {
    const textarea = await renderEditor(defaultProps);
    const applyButton = screen.getByRole('button', { name: /apply changes/i });
    const newDashboardObject = { key: 'value', subkey: 123 };
    const newFormData = {
      ...defaultProps.value,
      renders: { dashboard: newDashboardObject },
    };
    updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
    await userEvent.click(applyButton);
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          renders: { dashboard: JSON.stringify(newDashboardObject, null, 2) },
        })
      );
    });
  });

  describe('ID and Collection Change Logic', () => {
    it("allows 'collection' name change if disableCollectionNameChange is false", async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const newFormData = { ...defaultProps.value, collection: 'new-name' };
      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ collection: 'new-name' })
        );
      });
    });

    it("prevents 'collection' name change if disableCollectionNameChange is true", async () => {
      const propsWithDisabled = {
        ...defaultProps,
        disableCollectionNameChange: true,
      };
      const textarea = await renderEditor(propsWithDisabled);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const newFormData = { ...defaultProps.value, collection: 'new-name' };

      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith(
          'Collection name cannot be changed! Expected: "test-collection"'
        );
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("allows 'id' change if disableIdChange is false", async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const newFormData = { ...defaultProps.value, id: 'new-id-456' };
      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'new-id-456' })
        );
      });
    });

    it("prevents 'id' change if disableIdChange is true", async () => {
      const propsWithDisabled = { ...defaultProps, disableIdChange: true };
      const textarea = await renderEditor(propsWithDisabled);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const newFormData = { ...defaultProps.value, id: 'attempted-change' };

      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith(
          'ID cannot be changed! Expected: "initial-id-123"'
        );
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Strict Schema Enforcement', () => {
    it('allows extra fields and calls setAdditionalProperties with an object', async () => {
      const textarea = await renderEditor(defaultProps);
      const checkbox = screen.getByRole('checkbox');
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).not.toBeChecked());

      const newFormData = {
        ...defaultProps.value,
        extraField: true,
        anotherExtra: 'value',
      };
      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(mockSetAdditionalProperties).toHaveBeenCalledWith({
          extraField: true,
          anotherExtra: 'value',
        });
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ extraField: true })
        );
      });
    });

    it('does not allow extra fields and shows errors in the card', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const newFormData = { ...defaultProps.value, extraField: true };
      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        const card = screen.getByTestId('mock-additional-property-card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveAttribute('data-style', 'error');
        const expectedErrors = {
          'Error 1': 'extraField is not defined in schema',
        };
        expect(card.textContent).toContain(JSON.stringify(expectedErrors));
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('JSON and Schema Validation', () => {
    it('displays schema validation errors for predefined properties', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const invalidFormData = { ...defaultProps.value, stac_version: 123 };
      updateEditorValue(textarea, JSON.stringify(invalidFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        const card = screen.getByTestId('mock-additional-property-card');
        expect(card).toBeInTheDocument();
        const expectedErrors = { 'Error 1': 'stac_version must be string' };
        expect(card.textContent).toContain(JSON.stringify(expectedErrors));
      });
    });

    it('displays schema validation errors if Start Date is after End Date', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const invalidFormData = {
        ...defaultProps.value,
        temporal_extent: {
          startdate: '2025-01-02T00:00:00.000Z',
          enddate: '2025-01-01T23:59:59.000Z',
        },
      };
      updateEditorValue(textarea, JSON.stringify(invalidFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        const card = screen.getByTestId('mock-additional-property-card');
        expect(card).toBeInTheDocument();
        const expectedErrors = {
          'Error 1': 'End Date must be after Start Date in temporal_extent.',
        };
        expect(card.textContent).toContain(JSON.stringify(expectedErrors));
      });
    });
  });

  describe('Modal for Dashboard-Related Keys', () => {
    it('handles "Accept & Add Prefix" option correctly for `is_periodic`', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      updateEditorValue(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      const acceptButton = await screen.findByRole('button', {
        name: /accept & add prefix/i,
      });
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ 'dashboard:is_periodic': true })
        );
      });
    });

    it('handles "Leave Unchanged" option and unchecks strict schema', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const strictSchemaCheckbox = screen.getByRole('checkbox');

      updateEditorValue(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      const leaveButton = await screen.findByRole('button', {
        name: /leave unchanged/i,
      });
      await userEvent.click(leaveButton);

      await waitFor(() => {
        expect(strictSchemaCheckbox).not.toBeChecked();
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ is_periodic: true })
        );
      });
    });
  });
});
