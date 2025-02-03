import React from 'react';
import StyledModal from '@/components/StyledModal';

export default function ErrorModal({
  collectionName,
  apiErrorMessage,
}: {
  collectionName: string;
  apiErrorMessage?: string;
}) {
  // Regex pattern to detect GitHub file JSON format errors
  const githubFileErrorRegex = /Invalid JSON format in GitHub file: (.+)/;
  const match = apiErrorMessage?.match(githubFileErrorRegex);

  if (apiErrorMessage?.includes('Reference already exists')) {
    return (
      <StyledModal
        title="Collection Name Exists"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>
          A branch with the collection name <strong>{collectionName}</strong>{' '}
          already exists.
        </p>
        <p>Please try another collection name or delete the feature branch.</p>
      </StyledModal>
    );
  } else if (match) {
    // Specific case for invalid JSON file errors from GitHub
    return (
      <StyledModal
        title="Invalid JSON File"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>
          The GitHub file <strong>{match[1]}</strong> appears to be invalid.
        </p>
        <p>
          Please check that the file is a valid JSON and contains a
          <strong>collection</strong> key as a string.
        </p>
      </StyledModal>
    );
  } else {
    return (
      <StyledModal
        title="Something Went Wrong"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <strong>Something went wrong with updating {collectionName}.</strong>
        <p>Please try again.</p>
      </StyledModal>
    );
  }
}
