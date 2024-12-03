import React from 'react';
import { Status } from '../vite-env';
import StyledModal from './Modal';

export default function SuccessModal({ collectionName, pullRequestUrl, setStatus }: { collectionName: string; pullRequestUrl: string; setStatus: (status: Status) => void }) {
  const onOk = () => {
    setStatus('idle');
  };
  return (
    <StyledModal title='Collection Submitted' cancelButtonProps={{ style: { display: 'none' } }} okText='OK' onOk={onOk}>
      <p>
        The <strong>{collectionName}</strong> collection has been submitted.
      </p>
      <p>
        You can view the submitted request on{' '}
        <a href={pullRequestUrl} target='_blank' rel='noopener noreferrer'>
          Github<i aria-hidden='true'></i>
          <span className='visually-hidden'> opens a new window</span>
        </a>
        .
      </p>
    </StyledModal>
  );
}
