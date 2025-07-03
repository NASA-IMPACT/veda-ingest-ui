import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ExtensionManager from '@/components/ExtensionManager';
import { message } from 'antd';

// Mock Ant Design's message service
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd,
    message: {
      ...antd.message,
      error: vi.fn(),
    },
  };
});

describe('ExtensionManager', () => {
  let mockOnAddExtension: ReturnType<typeof vi.fn>;
  let mockOnRemoveExtension: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAddExtension = vi.fn();
    mockOnRemoveExtension = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders the title and search input correctly', () => {
    render(
      <ExtensionManager
        extensionFields={{}}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={false}
      />
    );

    expect(screen.getByText('STAC Extensions')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter extension schema URL')
    ).toBeInTheDocument();
  });

  it('calls onAddExtension and clears the input when a URL is submitted', async () => {
    const user = userEvent.setup();
    render(
      <ExtensionManager
        extensionFields={{}}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Enter extension schema URL'
    );
    const addButton = screen.getByRole('button', { name: 'Add Extension' });
    const testUrl = 'http://example.com/schema.json';

    await user.type(searchInput, testUrl);
    await user.click(addButton);

    expect(mockOnAddExtension).toHaveBeenCalledWith(testUrl);
    expect(searchInput).toHaveValue('');
  });

  it('shows an error message and does not call onAddExtension for an empty URL', async () => {
    const user = userEvent.setup();
    render(
      <ExtensionManager
        extensionFields={{}}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={false}
      />
    );

    const addButton = screen.getByRole('button', { name: 'Add Extension' });
    await user.click(addButton);

    expect(mockOnAddExtension).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith('Please enter a URL.');
  });

  it('renders a list of loaded extensions as closable tags', () => {
    const mockExtensions = {
      'http://a.com': { title: 'Extension A' },
      'http://b.com': { title: 'Extension B' },
    };

    render(
      <ExtensionManager
        extensionFields={mockExtensions}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={false}
      />
    );

    expect(screen.getByText('Loaded Extensions:')).toBeVisible();
    expect(screen.getByText('Extension A')).toBeVisible();
    expect(screen.getByText('Extension B')).toBeVisible();
  });

  it('calls onRemoveExtension with the correct URL when a tag is closed', async () => {
    const user = userEvent.setup();
    const urlToRemove = 'http://a.com';
    const mockExtensions = {
      [urlToRemove]: { title: 'Extension A' },
    };

    render(
      <ExtensionManager
        extensionFields={mockExtensions}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={false}
      />
    );

    const tag = screen.getByText('Extension A').closest('.ant-tag');
    const closeButton = within(tag as HTMLElement).getByLabelText(/close/i);

    await user.click(closeButton);

    expect(mockOnRemoveExtension).toHaveBeenCalledWith(urlToRemove);
  });

  it('shows a loading state on the search input when isLoading is true', () => {
    render(
      <ExtensionManager
        extensionFields={{}}
        onAddExtension={mockOnAddExtension}
        onRemoveExtension={mockOnRemoveExtension}
        isLoading={true}
      />
    );

    const searchContainer = screen
      .getByPlaceholderText('Enter extension schema URL')
      .closest('.ant-input-search');
    const loadingIcon = within(searchContainer as HTMLElement).getByRole(
      'img',
      { name: 'loading' }
    );

    expect(loadingIcon).toBeVisible();
  });
});
