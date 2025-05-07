import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateIngest from '@/app/create-ingest/page';

vi.mock('leaflet');

describe('Create Ingest Page', () => {
  it('renders the page without crashing', async () => {
    render(<CreateIngest />);

    // Check for the main content
    const collectionLabel = await screen.findByText(
      /collection/i,
      {},
      { timeout: 5000 }
    );
    expect(collectionLabel).toBeInTheDocument();
  });
});
