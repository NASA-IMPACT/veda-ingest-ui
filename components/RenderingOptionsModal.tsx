import React from "react";
import { Modal } from "antd";

interface RenderingOptionsModalProps {
  visible: boolean;
  options: any;
  onClose: () => void;
}

const RenderingOptionsModal: React.FC<RenderingOptionsModalProps> = ({ visible, options, onClose }) => {
  const displayedOptions = {
    ...options, 
    "assets": [
              "cog_default"
          ]}
  return (
    <Modal title="COG Rendering Options" open={visible} onCancel={onClose} footer={null}>
      <pre style={{ background: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
        {JSON.stringify(displayedOptions, null, 2)}
      </pre>
    </Modal>
  );
};

export default RenderingOptionsModal;
