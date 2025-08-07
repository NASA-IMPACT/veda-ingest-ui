import React from 'react';
import { Modal, ModalProps } from 'antd';

// Base props shared by both modal types
type BaseSuccessModalProps = {
  collectionName: string;
  onOk: () => void;
  onCancel: () => void;
  open: boolean;
};

type SuccessModalProps =
  | (BaseSuccessModalProps & {
      type: 'create';
      pullRequestUrl: string;
    })
  | (BaseSuccessModalProps & {
      type: 'edit';
    });

export default function SuccessModal(props: SuccessModalProps) {
  const title =
    props.type === 'edit'
      ? 'Ingestion Request Updated'
      : 'Ingestion Request Submitted';

  const content =
    props.type === 'edit' ? (
      <p>
        The update to <strong>{props.collectionName}</strong> collection has
        been submitted.
      </p>
    ) : (
      <>
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
      </>
    );

  return (
    <Modal
      title={title}
      open={props.open}
      onOk={props.onOk}
      onCancel={props.onCancel}
      okText="OK"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      {content}
    </Modal>
  );
}
