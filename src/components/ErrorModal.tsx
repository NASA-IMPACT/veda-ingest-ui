import StyledModal from './Modal';

export default function ErrorModal({collectionName, apiErrorMessage} : {collectionName: string, apiErrorMessage: string}) {

    if (apiErrorMessage.includes('Reference already exists')) {
      return (
        <StyledModal
        title="Collection Name Exists"
        cancelButtonProps={{ style: { display: 'none' } }}
        >
          <p>A branch with the collection name <strong>{collectionName}</strong> already exists.</p>
          <p>Please try another collection name or delete the feature branch.</p>
        </StyledModal>
      )
    } else {
      return (
        <StyledModal
        title="Something Went Wrong"
        cancelButtonProps={{ style: { display: 'none' } }}
        >
          <p>Something went wrong submitting the <strong>{collectionName}</strong> collection.</p>
          <p>Please try again.</p>
        </StyledModal>
      )
    }
};