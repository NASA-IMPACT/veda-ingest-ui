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
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JSONEditor from '@/components/JSONEditor';
import { message } from 'antd';
import type { MessageType } from 'antd/es/message/interface';

// --- JSDOM Workaround for Ant Design ---
Object.defineProperty(window, 'getComputedStyle', {
  value: (elt: Element, pseudoElt?: string) => {
    return {
      getPropertyValue: (prop: string) => {
        if (prop === 'overflow') return 'auto';
        if (prop === 'padding-right') return '0px';
        return '';
      },
    };
  },
});

vi.mock('next/dynamic', async () => {
  const actualCodeEditorModule = await vi.importActual<
    typeof import('@uiw/react-textarea-code-editor')
  >('@uiw/react-textarea-code-editor');

  return {
    __esModule: true,
    default: (loader: any, options: any) => {
      const DynamicComponentMock = (props: any) => {
        const CodeEditorComponent = actualCodeEditorModule.default;
        return <CodeEditorComponent {...props} />;
      };
      return DynamicComponentMock;
    },
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
        <div role="dialog" aria-modal="true" data-testid="mock-modal-overlay">
          <div role="document" data-testid="mock-modal-content">
            <h2 data-testid="mock-modal-title">{title}</h2>
            <div>{children}</div>
            {footer && (
              <div data-testid="mock-modal-footer">
                {footer.map((button: any, index: number) => (
                  <button
                    key={index}
                    onClick={button.props.onClick}
                    type="button"
                  >
                    {button.props.children}
                  </button>
                ))}
              </div>
            )}
            <button
              aria-label="Close"
              onClick={onCancel}
              data-testid="mock-modal-close-button"
            >
              X
            </button>
          </div>
        </div>
      );
    },
  };
});

// Mock `message.error` should be defined after the antd mock if it's imported from antd itself
vi.spyOn(message, 'error').mockImplementation(() => {
  return { destroy: vi.fn() } as unknown as MessageType;
});

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockFormData = {
  license: 'CC0-1.0',
  stac_version: '1.0.0',
  links: [],
  spatial_extent: {
    xmin: -180,
    ymin: -90,
    xmax: 180,
    ymax: 90,
  },
  temporal_extent: {
    startdate: '2025-02-07T00:00:00.000Z',
    enddate: '2025-02-07T23:59:59.000Z',
  },
  discovery_items: [
    {
      upload: false,
      cogify: false,
      dry_run: false,
      filename_regex: '[\\s\\S]*',
      use_multithreading: false,
      prefix: 'test',
      bucket: 'test',
    },
  ],
  sample_files: ['test'],
  data_type: 'cog',
  stac_extensions: [
    'https://stac-extensions.github.io/render/v1.0.0/schema.json',
    'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
  ],
  item_assets: {
    cog_default: {
      type: 'image/tiff; application=geotiff; profile=cloud-optimized',
      roles: ['data', 'layer'],
      title: 'Default COG Layer',
      description: 'Cloud optimized default layer to display on map',
    },
  },
  providers: [
    {
      name: 'NASA VEDA',
      roles: ['host'],
      url: 'https://www.earthdata.nasa.gov/dashboard/',
    },
  ],
  assets: {
    thumbnail: {
      title: 'Thumbnail',
      type: 'image/jpeg',
      roles: ['thumbnail'],
      href: 'test',
      description: 'test',
    },
  },
  collection: 'test-collection',
  title: 'test',
  description: 'test',
  renders: {
    dashboard: {
      json: true,
    },
  },
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
    const textarea = await screen.findByTestId('json-editor');
    return textarea;
  };

  const pasteIntoEditor = async (textarea: HTMLElement, content: string) => {
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(content);
    await waitFor(() => expect(textarea).toHaveValue(content));
  };

  it("converts 'renders.dashboard' from a stringified object to an object before displaying", async () => {
    const stringifiedDashboard = JSON.stringify(
      { key: 'value', nested: { a: 1 } },
      null,
      2
    );
    const testProps = {
      ...defaultProps,
      value: {
        ...defaultProps.value,
        renders: {
          dashboard: stringifiedDashboard,
        },
      },
    };

    const textarea = await renderEditor(testProps);
    expect(textarea).toHaveValue(
      JSON.stringify(
        {
          ...defaultProps.value,
          renders: { dashboard: { key: 'value', nested: { a: 1 } } },
        },
        null,
        2
      )
    );
  });

  it("converts 'renders.dashboard' from an object to a pretty JSON string before saving", async () => {
    const textarea = await renderEditor(defaultProps);
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const newDashboardObject = { key: 'value', subkey: 123 };
    const newFormData = {
      ...defaultProps.value,
      renders: { dashboard: newDashboardObject },
    };

    await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));
    await userEvent.click(applyButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        renders: { dashboard: JSON.stringify(newDashboardObject, null, 2) },
      })
    );
    expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
  });

  it("ignores 'renders' conversion if not parsable JSON string and leaves it as-is in the editor", async () => {
    const invalidDashboardString = 'this is not valid json';
    const testProps = {
      ...defaultProps,
      value: {
        ...defaultProps.value,
        renders: { dashboard: invalidDashboardString },
      },
    };

    const textarea = await renderEditor(testProps);
    expect(textarea).toHaveValue(
      JSON.stringify(
        {
          ...defaultProps.value,
          renders: { dashboard: invalidDashboardString },
        },
        null,
        2
      )
    );
    expect(screen.queryByText('Invalid JSON format.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Schema Validation Errors')
    ).not.toBeInTheDocument();
  });

  it("allows 'collection' name change if disableCollectionNameChange is false", async () => {
    const textarea = await renderEditor(defaultProps);
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const newFormData = {
      ...defaultProps.value,
      collection: 'new-collection-name',
    };
    await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

    await userEvent.click(applyButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'new-collection-name',
      })
    );
    expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
  });

  it("does not allow 'collection' name change if disableCollectionNameChange is true", async () => {
    const testProps = {
      ...defaultProps,
      disableCollectionNameChange: true,
    };

    const textarea = await renderEditor(testProps);
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    expect(screen.getByTestId('collectionName')).toHaveTextContent(
      `Editing ${defaultProps.value.collection}`
    );

    const newFormData = {
      ...defaultProps.value,
      collection: 'a-different-collection',
    };
    await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

    await userEvent.click(applyButton);

    expect(mockOnChange).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(
        `Collection name cannot be changed! Expected: "${defaultProps.value.collection}"`
      );
    });
    expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
  });

  describe('Strict Schema Enforcement', () => {
    it('allows extra fields when strict schema is unchecked', async () => {
      const textarea = await renderEditor(defaultProps);
      const checkbox = screen.getByRole('checkbox', {
        name: /enforce strict schema \(disallow extra fields\)/i,
      });
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      const newFormData = {
        ...defaultProps.value,
        extraField: true,
        anotherExtra: 'value',
      };
      await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

      await userEvent.click(applyButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          extraField: true,
          anotherExtra: 'value',
        })
      );
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith([
        'extraField',
        'anotherExtra',
      ]);
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
      expect(
        screen.queryByText('Schema Validation Errors')
      ).not.toBeInTheDocument();
    });

    it('does not allow extra fields when strict schema is checked and displays errors', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /enforce strict schema \(disallow extra fields\)/i,
      });
      expect(checkbox).toBeChecked();

      const newFormData = { ...defaultProps.value, extraField: true };
      await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

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
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });
  });

  describe('JSON and Schema Validation', () => {
    it('displays schema validation errors for predefined properties', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const invalidFormData = {
        ...defaultProps.value,
        stac_version: 123,
      };
      await pasteIntoEditor(textarea, JSON.stringify(invalidFormData, null, 2));

      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(
          screen.getByText('Schema Validation Errors')
        ).toBeInTheDocument();
        expect(
          screen.getByText('/stac_version must be string')
        ).toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });

    it('displays error if not valid JSON format', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const invalidJson = `{ "invalidField": "error" `;
      await pasteIntoEditor(textarea, invalidJson);

      await userEvent.click(applyButton);

      await waitFor(() =>
        expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument()
      );
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });

    it('displays schema validation errors if Start Date is after End Date in temporal extent', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const newFormData = {
        ...defaultProps.value,
        temporal_extent: {
          startdate: '2025-01-02T00:00:00.000Z',
          enddate: '2025-01-01T23:59:59.000Z',
        },
      };
      await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

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
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });

    it('displays schema validation errors for invalid date format in temporal extent', async () => {
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      const newFormData = {
        ...defaultProps.value,
        temporal_extent: {
          startdate: 'not-a-date',
          enddate: '2025-01-01T23:59:59.000Z',
        },
      };
      await pasteIntoEditor(textarea, JSON.stringify(newFormData, null, 2));

      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(
          screen.getByText('Schema Validation Errors')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Invalid date format in temporal_extent. Please use a valid date string.'
          )
        ).toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(true);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });
  });

  describe('Modal for Dashboard-Related Keys', () => {
    afterEach(() => {
      cleanup();
    });

    it('shows modal when `is_periodic` is at top level and strict schema is checked', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal-title')).toHaveTextContent(
          'Suggestion for Dashboard-Related Keys'
        );
        expect(
          screen.getByText(/it looks like you've included/i)
        ).toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('shows modal when `time_density` is at top level and strict schema is checked', async () => {
      const formDataWithTimeDensity = {
        ...defaultProps.value,
        time_density: 'P1D',
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithTimeDensity, null, 2)
      );
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal-title')).toHaveTextContent(
          'Suggestion for Dashboard-Related Keys'
        );
        expect(
          screen.getByText(/it looks like you've included/i)
        ).toBeInTheDocument();
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does NOT show modal when `is_periodic` is at top level and strict schema is UNchecked', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const checkbox = screen.getByRole('checkbox', {
        name: /enforce strict schema \(disallow extra fields\)/i,
      });
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      expect(
        screen.queryByTestId('mock-modal-overlay')
      ).not.toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ is_periodic: true })
      );
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(['is_periodic']);
    });

    it('handles "Accept & Add Prefix" option correctly for `is_periodic`', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      const modalOverlay = await screen.findByTestId('mock-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();
      expect(screen.getByTestId('mock-modal-title')).toHaveTextContent(
        'Suggestion for Dashboard-Related Keys'
      );

      const acceptButton = screen.getByRole('button', {
        name: /accept & add prefix/i,
      });
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Suggestion for Dashboard-Related Keys')
        ).not.toBeInTheDocument();
      });

      expect(textarea).toHaveValue(
        JSON.stringify(
          { ...defaultProps.value, 'dashboard:is_periodic': true },
          null,
          2
        )
      );

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ 'dashboard:is_periodic': true })
      );
      expect(mockOnChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ is_periodic: true })
      );
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });

    it('handles "Accept & Add Prefix" option correctly for `time_density`', async () => {
      const formDataWithTimeDensity = {
        ...defaultProps.value,
        time_density: 'P1D',
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithTimeDensity, null, 2)
      );
      await userEvent.click(applyButton);

      const modalOverlay = await screen.findByTestId('mock-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();

      const acceptButton = screen.getByRole('button', {
        name: /accept & add prefix/i,
      });
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Suggestion for Dashboard-Related Keys')
        ).not.toBeInTheDocument();
      });

      expect(textarea).toHaveValue(
        JSON.stringify(
          { ...defaultProps.value, 'dashboard:time_density': 'P1D' },
          null,
          2
        )
      );

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ 'dashboard:time_density': 'P1D' })
      );
      expect(mockOnChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ time_density: 'P1D' })
      );
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });

    it('handles "Leave Unchanged" option correctly for `is_periodic` and unchecks strict schema', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });
      const strictSchemaCheckbox = screen.getByRole('checkbox', {
        name: /enforce strict schema \(disallow extra fields\)/i,
      });

      expect(strictSchemaCheckbox).toBeChecked();

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      await userEvent.click(applyButton);

      const modalOverlay = await screen.findByTestId('mock-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();

      const leaveUnchangedButton = screen.getByRole('button', {
        name: /leave unchanged/i,
      });
      await userEvent.click(leaveUnchangedButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Suggestion for Dashboard-Related Keys')
        ).not.toBeInTheDocument();
      });

      expect(strictSchemaCheckbox).not.toBeChecked();

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ is_periodic: true })
      );
      expect(mockSetHasJSONChanges).toHaveBeenCalledWith(false);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(['is_periodic']);
    });

    it('handles "Cancel" option correctly and keeps the JSON unchanged (no apply)', async () => {
      const formDataWithIsPeriodic = {
        ...defaultProps.value,
        is_periodic: true,
      };
      const textarea = await renderEditor(defaultProps);
      const applyButton = screen.getByRole('button', {
        name: /apply changes/i,
      });

      await pasteIntoEditor(
        textarea,
        JSON.stringify(formDataWithIsPeriodic, null, 2)
      );
      mockOnChange.mockClear();
      mockSetHasJSONChanges.mockClear();
      mockSetAdditionalProperties.mockClear();

      await userEvent.click(applyButton);

      const modalOverlay = await screen.findByTestId('mock-modal-overlay');
      expect(modalOverlay).toBeInTheDocument();

      const closeModalButton = screen.getByTestId('mock-modal-close-button');
      await userEvent.click(closeModalButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Suggestion for Dashboard-Related Keys')
        ).not.toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockSetHasJSONChanges).not.toHaveBeenCalledWith(false);
      expect(mockSetAdditionalProperties).toHaveBeenCalledWith(null);
    });
  });
});
