import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateIngest from '@/app/create-ingest/page';

vi.mock('leaflet');

describe('Create Ingest Page', () => {

  it('renders the page without crashing', () => {
    render(<CreateIngest />);

    // Check for the main content
    expect(screen.getByLabelText(/collection/i)).toBeInTheDocument();
  });
});
