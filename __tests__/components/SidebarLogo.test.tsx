import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import SidebarLogo from '@/components/layout/SidebarLogo';

describe('SidebarLogo', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_ADDITIONAL_LOGO;
    delete process.env.NEXT_PUBLIC_MOCK_TENANTS;
    delete process.env.NEXT_PUBLIC_MOCK_SCOPES;
    delete process.env.NEXT_PUBLIC_DISABLE_AUTH;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders base icon and title when not collapsed', () => {
    render(<SidebarLogo collapsed={false} />);
    const baseIcon = screen.getByAltText('VEDA Ingest UI Logo');
    expect(baseIcon).toBeInTheDocument();
    expect(screen.getByText('VEDA Ingest UI')).toBeInTheDocument();
  });

  it('does not render title or mock banner when collapsed', () => {
    render(<SidebarLogo collapsed={true} />);
    expect(screen.queryByText('VEDA Ingest UI')).toBeNull();
    expect(screen.queryByText(/Mocking Tenants:/i)).toBeNull();
    expect(screen.queryByText(/Mocking Scopes:/i)).toBeNull();
    expect(screen.queryByText(/Mocking Auth/i)).toBeNull();
  });

  it('shows disaster logo when NEXT_PUBLIC_ADDITIONAL_LOGO=disaster', () => {
    process.env.NEXT_PUBLIC_ADDITIONAL_LOGO = 'disaster';
    render(<SidebarLogo collapsed={false} />);
    const disasterLogo = screen.getByAltText('Disasters Wordmark');
    expect(disasterLogo).toBeInTheDocument();
  });

  it('shows mock tenants banner when NEXT_PUBLIC_MOCK_TENANTS is set', () => {
    process.env.NEXT_PUBLIC_MOCK_TENANTS = 'tenant-a,tenant-b';
    render(<SidebarLogo collapsed={false} />);
    expect(screen.getByText(/Mocking Tenants:/)).toBeInTheDocument();
    expect(screen.getByText(/tenant-a,tenant-b/)).toBeInTheDocument();
  });

  it('shows mock scopes banner when NEXT_PUBLIC_MOCK_SCOPES is set', () => {
    process.env.NEXT_PUBLIC_MOCK_SCOPES =
      'dataset:update stac:collection:update';
    render(<SidebarLogo collapsed={false} />);
    expect(screen.getByText(/Mocking Scopes:/)).toBeInTheDocument();
    expect(
      screen.getByText(/dataset:update stac:collection:update/)
    ).toBeInTheDocument();
  });

  it('shows mock auth banner when NEXT_PUBLIC_DISABLE_AUTH=true', () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';
    render(<SidebarLogo collapsed={false} />);
    expect(screen.getByText('Mocking Auth')).toBeInTheDocument();
  });
});
