import React, { useState } from 'react';
import { Modal } from 'antd';

interface ErrorModalProps {
  collectionName?: string;
  apiErrorMessage?: string;
  context?:
    | 'collection-update'
    | 'collections-fetch'
    | 'ingests-fetch'
    | 'collection-select';
}

export default function ErrorModal({
  collectionName,
  apiErrorMessage,
  context = 'collection-update',
}: ErrorModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  let title: string;
  let content: React.ReactNode;

  const githubFileErrorRegex = /Invalid JSON format in GitHub file: (.+)/;
  const match = apiErrorMessage?.match(githubFileErrorRegex);

  if (apiErrorMessage?.includes('Reference already exists')) {
    title = 'Collection Name Exists';
    content = (
      <>
        <p>
          A branch with the collection name <strong>{collectionName}</strong>{' '}
          already exists.
        </p>
        <p>Please try another collection name or delete the feature branch.</p>
      </>
    );
  } else if (match) {
    title = 'Invalid JSON File';
    content = (
      <>
        <p>
          The GitHub file <strong>{match[1]}</strong> appears to be invalid.
        </p>
        <p>
          Please check that the file is a valid JSON and contains a{' '}
          <strong>collection</strong> key as a string.
        </p>
      </>
    );
  } else {
    const getContextualErrorMessage = () => {
      switch (context) {
        case 'collections-fetch':
          return {
            title: 'Failed to Load Collections',
            message:
              'Unable to fetch the list of collections. Please try again.',
          };
        case 'ingests-fetch':
          return {
            title: 'Failed to Load Pending Ingests',
            message: 'Unable to fetch pending ingest requests.',
          };
        case 'collection-select':
          return {
            title: 'Collection Access Error',
            message:
              'Unable to access the selected collection. You may not have permission or the collection may no longer exist.',
          };
        case 'collection-update':
        default:
          if (collectionName) {
            return {
              title: 'Something Went Wrong',
              message: `Something went wrong with updating ${collectionName}.`,
            };
          }
          return {
            title: 'Something Went Wrong',
            message: 'An unexpected error occurred.',
          };
      }
    };

    const contextualError = getContextualErrorMessage();
    title = contextualError.title;
    content = (
      <>
        <strong>{contextualError.message}</strong>
        <p>Please try again.</p>
      </>
    );
  }

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleOk}
      cancelButtonProps={{ style: { display: 'none' } }}
      okText="Try Again"
    >
      {content}
    </Modal>
  );
}
