import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateIngest from '@/app/create-ingest/page';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock `withAuthenticator` to bypass Amplify authentication
vi.mock('@aws-amplify/ui-react', () => ({
  withAuthenticator: (Component: any) => Component,
}));

// Mock `IngestCreationForm`
vi.mock('@/components/IngestCreationForm', () => ({
  default: ({
    setStatus,
    setCollectionName,
    setApiErrorMessage,
    setPullRequestUrl,
  }: any) => (
    <div data-testid="ingest-creation-form">
      <button
        onClick={() => {
          setStatus('success');
          setCollectionName('Test Collection');
          setPullRequestUrl('http://example.com/pull-request');
        }}
      >
        Simulate Success
      </button>
      <button
        onClick={() => {
          setStatus('error');
          setCollectionName('Failed Collection');
          setApiErrorMessage('API error occurred');
        }}
      >
        Simulate Error
      </button>
    </div>
  ),
}));

// Mock `ErrorModal`
vi.mock('@/components/ErrorModal', () => ({
  default: ({ collectionName, apiErrorMessage }: any) => (
    <div role="dialog" data-testid="error-modal">
      <p>Error Modal</p>
      <p>Collection: {collectionName}</p>
      <p>Message: {apiErrorMessage}</p>
    </div>
  ),
}));

// Mock `SuccessModal`
vi.mock('@/components/SuccessModal', () => ({
  default: ({ collectionName, pullRequestUrl }: any) => (
    <div role="dialog" data-testid="success-modal">
      <p>Success Modal</p>
      <p>Collection: {collectionName}</p>
      <p>Pull Request: {pullRequestUrl}</p>
    </div>
  ),
}));

describe('CreateIngest Page', () => {

  afterEach(() => {
    cleanup();
  });

  it('displays the SuccessModal on a successful API call', async () => {
    render(<CreateIngest />);

    const formContainer = screen.getByTestId('ingest-creation-form');
    const successButton = within(formContainer).getByRole('button', {name: 'Simulate Success'});
    userEvent.click(successButton);

    const successModal = await screen.findByTestId('success-modal');
    expect(successModal).toHaveTextContent('Success Modal');
    expect(successModal).toHaveTextContent('Collection: Test Collection');
    expect(successModal).toHaveTextContent('Pull Request: http://example.com/pull-request');
  });

  it('displays the ErrorModal on a failed API call', async () => {
    render(<CreateIngest />);

    const formContainer = screen.getByTestId('ingest-creation-form');
    const errorButton = within(formContainer).getByRole('button', {name: 'Simulate Error'});;
    userEvent.click(errorButton);

    const errorModal = await screen.findByTestId('error-modal');
    expect(errorModal).toHaveTextContent('Error Modal');
    expect(errorModal).toHaveTextContent('Collection: Failed Collection');
    expect(errorModal).toHaveTextContent('Message: API error occurred');
  });
  

});