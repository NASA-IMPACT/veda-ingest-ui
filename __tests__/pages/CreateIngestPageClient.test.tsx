import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateIngestClient from '@/app/create-ingest/_components/CreateIngestClient';

describe('CreateIngestClient Component', () => {
  it('renders the app layout', () => {
    render(<CreateIngestClient />);

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the label "Collection Name"', async () => {
    render(<CreateIngestClient />);
    // Check for the main content
    const collectionLabel = await screen.findByLabelText(
      /collection/i,
      {},
      { timeout: 5000 }
    );
    expect(collectionLabel).toBeInTheDocument();
  });
});
