import React from "react";
import { Form, Select, Space } from "antd";

interface COGControlsProps {
  selectedColormap: string;
  availableColormaps: string[];
  onColormapChange: (colormap: string) => void;
}

const COGControls: React.FC<COGControlsProps> = ({
  selectedColormap,
  availableColormaps,
  onColormapChange,
}) => {
  return (
    <Form layout="vertical">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Form.Item label="Select Colormap">
          <Select
            value={selectedColormap}
            onChange={onColormapChange}
            style={{ width: "100%" }}
          >
            {availableColormaps.map((name) => (
              <Select.Option key={name} value={name}>
                {name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Space>
    </Form>
  );
};

export default COGControls;
