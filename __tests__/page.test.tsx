import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import Home from '@/app/page';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';

describe('Home Page', () => {
  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
  });

  it('renders the page without crashing', () => {
    render(<Home />);
    
    // Check for the main content
    expect(screen.getByText(/This application allows/i)).toBeInTheDocument();
  });
});
