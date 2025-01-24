import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { setupServer } from 'msw/node';
import { handlers } from '@/__mocks__/handlers';
import { http, HttpResponse } from 'msw';

import EditIngest from '@/app/edit-ingest/page';

global.window.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn(),
  display: 'block',
}));

describe('Edit Ingest Page', () => {
  const server = setupServer(...handlers);

  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  

  it('displays the ErrorModal on API error when loading an ingest', async () => {
    // Mock API error for `retrieve-ingest`
    server.use(
      http.get('api/retrieve-ingest', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // Suppress console.error for this test
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<EditIngest />);

    // Simulate interaction to trigger the error
    const pendingPullRequest = await screen.findByRole('button', { name: /seeded ingest #1/i });
    await userEvent.click(pendingPullRequest);

    // Verify ErrorModal appears
    const errorModal = await screen.findByText(
      /Something went wrong with updating Ingest Request for seeded ingest #1/i
    );
    expect(errorModal).toBeInTheDocument();
        
    // Restore console.error
    consoleErrorMock.mockRestore();
  });

  it('displays the SuccessModal on successful edit', async () => {

    render(<EditIngest />);

    // Simulate interaction to open the form
    const pendingPullRequest = await screen.findByRole('button', { name: /seeded ingest #1/i });
    await userEvent.click(pendingPullRequest);

    // Verify the form is displayed
    await screen.findByLabelText('Collection');

    await screen.findByDisplayValue(/seeded-ingest-1/i );
    const descriptionInput = await screen.findByDisplayValue(/seeded ingest description #1/i );

    // update something other than collection name
    await userEvent.type(descriptionInput, 'updated description');

    // Submit the form
    const submitButton = await screen.findByRole('button', { name: /submit/i });
    userEvent.click(submitButton);

    // // Verify SuccessModal appears
    await waitFor(() => {
      const modalTitle = screen.getByText(/Collection Updated/i);
      expect(modalTitle).toBeInTheDocument();
    });
  }, 10000);

});
