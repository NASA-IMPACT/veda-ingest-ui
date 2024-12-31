import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import EditIngest from './page';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { setupServer } from 'msw/node';
import { handlers } from '@/__mocks__/handlers';
import { http, HttpResponse } from 'msw';

describe('Edit Ingest Page', () => {
  const server = setupServer(...handlers);

  beforeAll(() => {
    Amplify.configure({ ...config }, { ssr: true });
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('displays the ErrorModal on API error', async () => {
    // Mock API error for `retrieve-ingest`
    server.use(
      http.get('api/retrieve-ingest', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<EditIngest />);

    // Simulate interaction to trigger the error
    const pendingPullRequest = await screen.findByRole('button', { name: /seeded ingest #1/i });
    fireEvent.click(pendingPullRequest);

    // Verify ErrorModal appears
    const errorModal = await screen.findByText(
      /Something went wrong with updating Ingest Request for seeded ingest #1/i
    );
    expect(errorModal).toBeInTheDocument();
  });

  it('displays the SuccessModal on successful edit', async () => {
    // Mock API success for `edit-ingest`
    server.use(
      http.put('api/edit-ingest', () => {
        return new HttpResponse('Data updated successfully', { status: 200 });
      })
    );

    render(<EditIngest />);

    // Simulate interaction to open the form
    const pendingPullRequest = await screen.findByRole('button', { name: /seeded ingest #1/i });
    fireEvent.click(pendingPullRequest);

    // Verify the form is displayed

    await screen.findByLabelText('Collection');
    console.log(document.body.innerHTML);

    const descriptionInput = await screen.findByRole('textarea', { name: /description/i });

    fireEvent.change(descriptionInput, { target: { value: 'updated description' } });

    // Submit the form
    const submitButton = await screen.findByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Verify SuccessModal appears
    const successModal = await screen.findByTestId('success-modal');
    expect(successModal).toBeInTheDocument();
    expect(successModal).toHaveTextContent('Success Modal');
  });
});
