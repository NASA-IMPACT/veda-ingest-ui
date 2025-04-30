import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the page without crashing', () => {
    render(<Home />);

    // Check for the main content
    expect(screen.getByText(/This application allows/i)).toBeInTheDocument();
  });
});
