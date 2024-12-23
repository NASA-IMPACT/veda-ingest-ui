import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import CreateIngest from './page';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';

describe('Create Ingest Page', () => {
  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
  });

  it.only('renders the page without crashing', () => {
    render(<CreateIngest />);
    
    // Check for the main content
    expect(screen.getByLabelText(/collection/i)).toBeInTheDocument();
  });
});
