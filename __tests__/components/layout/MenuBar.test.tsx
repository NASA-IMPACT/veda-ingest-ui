import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuBar from '@/components/layout/MenuBar';
import React from 'react';

// Mock next things
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('MenuBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  it('renders home menu item', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: [],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders collection management section', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: [],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Collection Management')).toBeInTheDocument();
    expect(screen.getByText('Create Collection')).toBeInTheDocument();
  });

  it('renders dataset management section', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: [],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Dataset Management')).toBeInTheDocument();
    expect(screen.getByText('Create Dataset')).toBeInTheDocument();
  });

  it('renders tools section with COG Viewer and Thumbnail Uploader', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: [],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('COG Viewer')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail Uploader')).toBeInTheDocument();
  });

  it('shows Edit Collection Ingest when user has dataset:update permission', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: ['dataset:update'],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Edit Collection Ingest')).toBeInTheDocument();
  });

  it('shows Edit Existing Collection when user has dataset:update permission', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: ['dataset:update'],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Edit Existing Collection')).toBeInTheDocument();
  });

  it('shows Edit Dataset Ingestion when user has dataset:update permission', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: ['dataset:update'],
      },
    });

    render(<MenuBar />);

    expect(screen.getByText('Edit Dataset Ingestion')).toBeInTheDocument();
  });

  it('hides edit options when user does not have dataset:update permission', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: [],
      },
    });

    render(<MenuBar />);

    expect(
      screen.queryByText('Edit Collection Ingest')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Edit Existing Collection')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Edit Dataset Ingestion')
    ).not.toBeInTheDocument();
  });

  it('hides edit options when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
    });

    render(<MenuBar />);

    expect(
      screen.queryByText('Edit Collection Ingest')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Edit Existing Collection')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Edit Dataset Ingestion')
    ).not.toBeInTheDocument();
  });

  it('renders all menu links with correct hrefs', () => {
    mockUseSession.mockReturnValue({
      data: {
        scopes: ['dataset:update'],
      },
    });

    const { container } = render(<MenuBar />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');

    const createCollectionLink = screen
      .getByText('Create Collection')
      .closest('a');
    expect(createCollectionLink).toHaveAttribute('href', '/create-collection');

    const createDatasetLink = screen.getByText('Create Dataset').closest('a');
    expect(createDatasetLink).toHaveAttribute('href', '/create-dataset');

    const cogViewerLink = screen.getByText('COG Viewer').closest('a');
    expect(cogViewerLink).toHaveAttribute('href', '/cog-viewer');

    const uploadLink = screen.getByText('Thumbnail Uploader').closest('a');
    expect(uploadLink).toHaveAttribute('href', '/upload');
  });
});
