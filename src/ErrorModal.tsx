import StyledModal from './Modal';

export default function ErrorModal({collectionName} : {collectionName: string}) {

  return (
      <StyledModal
      title="Collection Name Exists"
      cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>A branch with the collection name <strong>{collectionName}</strong> already exists.</p>
        <p>Please try another collection name or delete the feature branch.</p>
      </StyledModal>
  );
};