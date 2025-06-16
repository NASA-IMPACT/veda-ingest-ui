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
import JSONEditor from '@/components/JSONEditor';
import { message } from 'antd';
import type { MessageType } from 'antd/es/message/interface';

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
    default: () => CodeEditorModule.default,
  };
});

// --- Mock Ant Design's Modal Component ---
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd,
    Modal: ({ open, title, children, footer, onCancel }: any) => {
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
    },
  };
});

vi.spyOn(message, 'error').mockImplementation(() => ({}) as MessageType);

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

// --- Mock Data & Schema ---
const mockFormData = {
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
      jsonSchema: structuredClone(mockJsonSchema), // **FIX: Provide the schema**
      onChange: mockOnChange,
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

  it("allows 'collection' name change if disableCollectionNameChange is false", async () => {
    const textarea = await renderEditor(defaultProps);
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const newFormData = {
      ...defaultProps.value,
      collection: 'new-collection-name',
    };
    updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'new-collection-name' })
      );
    });
  });

  describe('Strict Schema Enforcement', () => {
    it('allows extra fields when strict schema is unchecked', async () => {
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
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ extraField: true, anotherExtra: 'value' })
        );
      });
    });

    it('does not allow extra fields when strict schema is checked', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const newFormData = { ...defaultProps.value, extraField: true };
      updateEditorValue(textarea, JSON.stringify(newFormData, null, 2));
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(
          screen.getByText('Schema Validation Errors')
        ).toBeInTheDocument();
        expect(
          screen.getByText('extraField is not defined in schema')
        ).toBeInTheDocument();
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
        expect(
          screen.getByText('Schema Validation Errors')
        ).toBeInTheDocument();
        expect(
          screen.getByText('/stac_version must be string')
        ).toBeInTheDocument();
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
        expect(
          screen.getByText('Schema Validation Errors')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'End Date must be after Start Date in temporal_extent.'
          )
        ).toBeInTheDocument();
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
