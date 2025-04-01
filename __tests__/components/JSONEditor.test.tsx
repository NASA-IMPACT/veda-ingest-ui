import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  findByRole,
  findByTestId,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JSONEditor from '@/components/JSONEditor';
import { message } from 'antd';
import type { MessageType } from 'antd/es/message/interface';

// Mock `message.error`
vi.spyOn(message, 'error').mockImplementation(() => {
  return { destroy: vi.fn() } as unknown as MessageType;
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
      value: mockFormData,
      onChange: mockOnChange,
      disableCollectionNameChange: false,
      hasJSONChanges: true,
      setHasJSONChanges: mockSetHasJSONChanges,
      setAdditionalProperties: mockSetAdditionalProperties,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("converts 'renders.dashboard' from a stringified object to an object before displaying", async () => {
    const testProps = {
      ...defaultProps,
      value: {
        renders: {
          dashboard: JSON.stringify({ key: 'value' }),
        },
      },
    };

    render(<JSONEditor {...testProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');

    expect(textarea).toHaveValue(
      JSON.stringify({ renders: { dashboard: { key: 'value' } } }, null, 2)
    );
  });

  it("converts 'renders.dashboard' from an object to a pretty JSON string before saving", async () => {
    render(<JSONEditor {...defaultProps} />);

    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const newFormData = {
      ...mockFormData,
      renders: { dashboard: { key: 'value' } },
    };
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(JSON.stringify(newFormData));

    await waitFor(() =>
      expect(textarea).toHaveValue(JSON.stringify(newFormData))
    );

    await userEvent.click(applyButton);

    // Actual `renders` received
    const firstCallRenders = mockOnChange.mock.calls[0][0].renders.dashboard;

    // Verify `renders` is pretty-printed (auto-generated snapshot)
    expect(firstCallRenders).toMatchInlineSnapshot(`
      "{
        "key": "value"
      }"
    `);
  });

  it("ignores 'renders' conversion if not parsable JSON string", async () => {
    const testProps = {
      ...defaultProps,
      value: {
        renders: 'value',
      },
    };

    render(<JSONEditor {...testProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');

    expect(textarea).toHaveValue(JSON.stringify({ renders: 'value' }, null, 2));
  });

  it("allows 'collection' name change if disableCollectionNameChange false", async () => {
    render(<JSONEditor {...defaultProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const newFormData = { ...mockFormData, collection: 'new name' };
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(JSON.stringify(newFormData));

    await waitFor(() =>
      expect(textarea).toHaveValue(JSON.stringify(newFormData))
    );

    await userEvent.click(applyButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'new name',
      })
    );
  });

  it("does not allow 'collection' name change if disableCollectionNameChange true", async () => {
    const testProps = {
      ...defaultProps,
      disableCollectionNameChange: true,
    };

    render(<JSONEditor {...testProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    expect(screen.getByTestId('collectionName')).toHaveTextContent(
      'Editing test-collection'
    );

    const newFormData = { ...mockFormData, collection: 'new name' };
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(JSON.stringify(newFormData));

    await waitFor(() =>
      expect(textarea).toHaveValue(JSON.stringify(newFormData))
    );

    await userEvent.click(applyButton);

    expect(mockOnChange).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(
        `Collection name cannot be changed! Expected: "test-collection"`
      );
    });
  });

  it('allows extra fields when strict schema is unchecked', async () => {
    render(<JSONEditor {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox', {
      name: /enforce strict schema/i,
    });
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const newFormData = { ...mockFormData, extraField: true };
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(JSON.stringify(newFormData));

    await userEvent.click(applyButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        extraField: true,
      })
    );
  });

  it('does not allow extra fields when strict schema is checked', async () => {
    render(<JSONEditor {...defaultProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    const checkbox = screen.getByRole('checkbox', {
      name: /enforce strict schema/i,
    });
    expect(checkbox).toBeChecked();

    const newFormData = { ...mockFormData, extraField: true };
    await userEvent.clear(textarea);
    textarea.focus();
    await userEvent.paste(JSON.stringify(newFormData));

    await userEvent.click(applyButton);

    await waitFor(() =>
      expect(screen.getByText('Schema Validation Errors')).toBeInTheDocument()
    );

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('displays schema validation errors', async () => {
    render(<JSONEditor {...defaultProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    fireEvent.change(textarea, {
      target: { value: `{ "invalidField": "error" }` },
    });

    await userEvent.click(applyButton);

    await waitFor(() =>
      expect(screen.getByText('Schema Validation Errors')).toBeInTheDocument()
    );
  });

  it('displays error if not valid json', async () => {
    render(<JSONEditor {...defaultProps} />);
    const textarea = await findByTestId(document.body, 'json-editor');
    const applyButton = screen.getByRole('button', { name: /apply changes/i });

    fireEvent.change(textarea, {
      target: { value: `{ "invalidField: error" }` },
    });

    await userEvent.click(applyButton);

    await waitFor(() =>
      expect(screen.getByText('Invalid JSON format.')).toBeInTheDocument()
    );
  });
});
