import React, { useState } from 'react';
import { Modal, ModalProps } from 'antd';

export default function StyledModal({ title, cancelButtonProps, okText = 'Try Again', children }: ModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Modal title={title} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText={okText} cancelButtonProps={cancelButtonProps}>
      {children}
    </Modal>
  );
}