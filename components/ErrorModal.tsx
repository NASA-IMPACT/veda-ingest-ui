import React, { useState } from 'react';
import { Modal } from 'antd';

interface ErrorModalProps {
  collectionName: string;
  apiErrorMessage?: string;
}

export default function ErrorModal({
  collectionName,
  apiErrorMessage,
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
    title = 'Something Went Wrong';
    content = (
      <>
        <strong>
          Something went wrong
          {collectionName ? ` with updating ${collectionName}` : ''}.
        </strong>
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
