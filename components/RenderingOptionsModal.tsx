import React, { useState } from "react";
import { Button, message, Modal } from "antd";

interface RenderingOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  options: {
    bidx: number[];
    rescale?: [number | null, number | null][] | null;
    colormap_name?: string;
    color_formula?: string;
    resampling?: string | null;
    nodata?: string | null;
  };
}

const RenderingOptionsModal: React.FC<RenderingOptionsModalProps> = ({ visible, options, onClose }) => {
  const [copied, setCopied] = useState(false);

  const { bidx, rescale, colormap_name, color_formula, resampling, nodata } = options;

  // Build the rendering options object dynamically
  const renderingOptions: Record<string, any> = {
    bidx,
    ...(rescale && rescale.length > 0
      ? { rescale: rescale.map(([min, max]) => (min !== null && max !== null ? [min, max] : null)).filter(Boolean) }
      : {}),
    ...(colormap_name && colormap_name.toLowerCase() !== "internal" ? { colormap_name } : {}),
    ...(color_formula ? { color_formula } : {}),
    ...(resampling ? { resampling } : {}),
    ...(nodata ? { nodata } : {}),
    "assets": [
              "cog_default"
          ],
  };

  const formattedOptions = JSON.stringify(renderingOptions, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedOptions);
      setCopied(true);
      message.success("Rendering options copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      message.error("Failed to copy rendering options.");
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  }

  return (
    <Modal title="COG Rendering Options"
      open={visible} 
      onCancel={ handleClose}
      footer={
        <>
          <Button 
            type="primary"
            onClick={handleCopy}
          >
            {copied ? 'Copied!': 'Copy'}
          </Button>
          <Button 
            onClick={handleClose}
          >
            Cancel
          </Button>
        </>
      }>
      <pre style={{ background: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
        {formattedOptions}
      </pre>
    </Modal>
  );
};

export default RenderingOptionsModal;
