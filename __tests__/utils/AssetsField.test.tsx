import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FieldProps } from '@rjsf/utils';
import AssetsField from '@/utils/AssetsField';

// We will test against the real child components, so the mock is removed.
// We still need to mock the RJSF-provided fields/templates.

const MockSchemaField = vi.fn(
  ({ formData, onChange }: FieldProps<Record<string, any>>) => (
    <div>
      {/* Simulate a change within the asset's form */}
      <button onClick={() => onChange({ ...formData, title: 'Updated Title' })}>
        Update Asset
      </button>
    </div>
  )
);

const MockTitleField = ({ title }: { title: string }) => <h1>{title}</h1>;
const MockDescriptionField = ({ description }: { description: string }) => (
  <p>{description}</p>
);

describe('AssetsField', () => {
  const mockOnChange = vi.fn();
  let baseProps: FieldProps;

  beforeEach(() => {
    vi.clearAllMocks();
    baseProps = {
      schema: {
        type: 'object',
        title: 'Assets',
        description: 'A list of assets.',
        additionalProperties: {
          type: 'object',
          properties: {
            href: { type: 'string' },
            title: { type: 'string' },
          },
        },
      },
      formData: {
        thumbnail: { href: './thumb.png', title: 'Thumbnail' },
        data: { href: './data.tiff', title: 'Data' },
      },
      onChange: mockOnChange,
      registry: {
        fields: {
          SchemaField: MockSchemaField,
        },
        templates: {
          TitleFieldTemplate: MockTitleField,
          DescriptionFieldTemplate: MockDescriptionField,
        },
      },
      idSchema: { $id: 'root_assets' },
      name: 'assets',
      uiSchema: {},
      disabled: false,
      readonly: false,
      formContext: {},
    } as unknown as FieldProps;
  });

  it('should render initial assets correctly', () => {
    render(<AssetsField {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Assets' })).toBeInTheDocument();
    expect(screen.getByText('A list of assets.')).toBeInTheDocument();

    // Find inputs by their displayed value
    expect(screen.getByDisplayValue('thumbnail')).toBeInTheDocument();
    expect(screen.getByDisplayValue('data')).toBeInTheDocument();

    expect(MockSchemaField).toHaveBeenCalledTimes(2);
  });

  it('should add a new asset when the add button is clicked', () => {
    render(<AssetsField {...baseProps} />);

    // Find the add button by its tooltip title, which is more accessible
    const addButton = screen.getByRole('button', { name: /Add Asset/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedFormData = mockOnChange.mock.calls[0][0];

    expect(Object.keys(updatedFormData).length).toBe(3);
    expect(updatedFormData).toHaveProperty('new_asset');
  });

  it('should remove an asset', () => {
    render(<AssetsField {...baseProps} />);

    // Find the specific card containing the 'thumbnail' asset
    const thumbnailInput = screen.getByDisplayValue('thumbnail');
    const thumbnailCard = thumbnailInput.closest(
      '.ant-card-body'
    ) as HTMLElement;

    // Find the remove button *within* that specific card
    const removeButton = within(thumbnailCard!).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedFormData = mockOnChange.mock.calls[0][0];

    expect(updatedFormData).not.toHaveProperty('thumbnail');
    expect(Object.keys(updatedFormData).length).toBe(1);
  });

  it('should handle changing an asset key', () => {
    render(<AssetsField {...baseProps} />);

    const keyInput = screen.getByDisplayValue('thumbnail');
    fireEvent.change(keyInput, { target: { value: 'new_thumbnail_key' } });
    fireEvent.blur(keyInput);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedFormData = mockOnChange.mock.calls[0][0];

    expect(updatedFormData).not.toHaveProperty('thumbnail');
    expect(updatedFormData).toHaveProperty('new_thumbnail_key');
    expect(updatedFormData.new_thumbnail_key.title).toBe('Thumbnail');
  });

  it('should prevent renaming an existing key', () => {
    render(<AssetsField {...baseProps} />);

    const keyInput = screen.getByDisplayValue('thumbnail');
    // Try to rename 'thumbnail' to 'data' (which already exists)
    fireEvent.change(keyInput, { target: { value: 'data' } });
    fireEvent.blur(keyInput);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // The component should call onChange with the *original* data, effectively cancelling the rename
    expect(mockOnChange).toHaveBeenCalledWith(baseProps.formData);
  });

  it('should update an asset’s value when its SchemaField changes', () => {
    render(<AssetsField {...baseProps} />);

    // Find all update buttons and click the first one
    const updateButtons = screen.getAllByRole('button', {
      name: 'Update Asset',
    });
    fireEvent.click(updateButtons[0]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedFormData = mockOnChange.mock.calls[0][0];

    expect(updatedFormData.thumbnail.title).toBe('Updated Title');
  });

  it('should handle adding more than one new asset', () => {
    const { rerender } = render(<AssetsField {...baseProps} />);
    const addButton = screen.getByRole('button', { name: /Add Asset/i });

    // --- First Add ---
    fireEvent.click(addButton);

    // Verify the first call to onChange
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const firstUpdate = mockOnChange.mock.calls[0][0];
    expect(Object.keys(firstUpdate).length).toBe(3);
    expect(firstUpdate).toHaveProperty('new_asset');

    // --- Second Add ---
    // Rerender the component with the updated form data
    rerender(<AssetsField {...baseProps} formData={firstUpdate} />);

    // Click the add button again
    fireEvent.click(addButton);

    // Verify the second call to onChange
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    const secondUpdate = mockOnChange.mock.calls[1][0];
    expect(Object.keys(secondUpdate).length).toBe(4);
    // Check for the next unique key, which should be 'new_asset_1'
    expect(secondUpdate).toHaveProperty('new_asset_1');
  });
});
