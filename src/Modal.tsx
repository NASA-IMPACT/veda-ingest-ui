import { useState } from 'react';
import { Modal, ModalProps } from 'antd';

export default function StyledModal( { title, cancelButtonProps, children }: ModalProps) {

  const [isModalOpen, setIsModalOpen] = useState(true);


  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
      <Modal title={title}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Try Again"
        cancelButtonProps={cancelButtonProps}
        >
        {children}
      </Modal>
  );
};