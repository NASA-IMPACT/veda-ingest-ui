import React from 'react';
import StyledModal from './StyledModal';
import { Status } from '@/types/global';

type SuccessModalProps =
  | {
      type: 'create';
      collectionName: string;
      pullRequestUrl: string;
      setStatus: (status: Status) => void;
    }
  | {
      type: 'edit';
      collectionName: string;
      setStatus: (status: Status) => void;
    };

export default function SuccessModal(props: SuccessModalProps) {
  const { setStatus } = props;
  const onOk = () => {
    setStatus('idle');
  };

  if (props.type === 'create') {
    return (
      <StyledModal
        title="Collection Submitted"
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="OK"
        onOk={onOk}
      >
        <p>
          The <strong>{props.collectionName}</strong> collection has been
          submitted.
        </p>
        <p>
          You can view the submitted request on{' '}
          <a
            href={props.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Github<i aria-hidden="true"></i>
            <span className="visually-hidden"> opens a new window</span>
          </a>
          .
        </p>
      </StyledModal>
    );
  } else {
    return (
      <StyledModal
        title="Collection Updated"
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="OK"
        onOk={onOk}
      >
        <p>
          The update to <strong>{props.collectionName}</strong> collection has
          been submitted.
        </p>
      </StyledModal>
    );
  }
}
