import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SessionProvider } from 'next-auth/react';

import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the page without crashing', async () => {
    render(
      <SessionProvider session={null}>
        <Home />
      </SessionProvider>
    );

    expect(screen.findByText(/This application allows/i)).toBeInTheDocument();
  });
});
