import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import EditIngest from './page';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { setupServer } from 'msw/node';
import { handlers } from '@/__mocks__/handlers';

describe('Edit Ingest Page', () => {
  const server = setupServer(...handlers);

  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
    server.listen();
    
  });

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('renders the page without crashing', async () => {
  render(<EditIngest />);
  
  // Check for the main content
  expect(screen.queryByLabelText(/collection/i)).not.toBeInTheDocument();

  const pendingPullRequest = await screen.findByRole('button', {name: /seeded ingest #1/i});

  fireEvent.click(pendingPullRequest)

  const collectionInput = await screen.findByLabelText(/collection/i);

  expect(collectionInput, 'user should be unable to edit collection name').toBeDisabled();
  expect(collectionInput).toHaveValue('seeded ingest #1')
});
});
