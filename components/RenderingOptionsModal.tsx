import React from "react";
import { Modal } from "antd";

interface RenderingOptionsModalProps {
  visible: boolean;
  options: any;
  onClose: () => void;
}

const RenderingOptionsModal: React.FC<RenderingOptionsModalProps> = ({ visible, options, onClose }) => {
  return (
    <Modal title="COG Rendering Options" visible={visible} onCancel={onClose} footer={null}>
      <pre style={{ background: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
        {JSON.stringify(options, null, 2)}
      </pre>
    </Modal>
  );
};

export default RenderingOptionsModal;
