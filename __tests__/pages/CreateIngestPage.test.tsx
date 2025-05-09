import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import CreateIngest from '@/app/create-ingest/page';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';

vi.mock('leaflet');

describe('Create Ingest Page', () => {
  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
  });

  it('renders the page without crashing', async () => {
    render(<CreateIngest />);

    // Check for the main content
    expect(screen.getByLabelText(/collection/i)).toBeInTheDocument();
  });
});
