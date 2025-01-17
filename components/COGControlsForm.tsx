import React from "react";
import { Button, InputNumber, Select, Form, Row, Col } from "antd";

const { Option } = Select;

interface COGControlsFormProps {
  metadata: any;
  selectedBand: number;
  rescaleMin: number;
  rescaleMax: number;
  selectedColormap: string;
  colorFormula: string;
  selectedResampling: string;
  noDataValue: string;
  hasChanges: boolean;
  onBandChange: (value: number) => void;
  onRescaleMinChange: (value: number) => void;
  onRescaleMaxChange: (value: number) => void;
  onColormapChange: (value: string) => void;
  onColorFormulaChange: (value: string) => void;
  onResamplingChange: (value: string) => void;
  onNoDataValueChange: (value: string) => void;
  onUpdateTileLayer: () => void;
  onViewRenderingOptions: () => void;
  loading: boolean;
}

const COGControlsForm: React.FC<COGControlsFormProps> = ({
  metadata,
  selectedBand,
  rescaleMin,
  rescaleMax,
  selectedColormap,
  colorFormula,
  selectedResampling,
  noDataValue,
  hasChanges,
  onBandChange,
  onRescaleMinChange,
  onRescaleMaxChange,
  onColormapChange,
  onColorFormulaChange,
  onResamplingChange,
  onNoDataValueChange,
  onUpdateTileLayer,
  onViewRenderingOptions,
  loading,
}) => {
  return (
    <Form layout="vertical">
      {/* First Row */}
      <Row gutter={16}>
        {/* Band */}
        <Col span={6}>
          <Form.Item label="Band">
            <Select
              value={selectedBand}
              onChange={(value) => onBandChange(value)}
              disabled={!metadata || !metadata.band_descriptions}
            >
              {metadata?.band_descriptions?.map(([band, description]: [string, string], index: number) => (
                <Option key={index} value={index + 1}>
                  {`${band} - ${description}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Rescale Min */}
        <Col span={6}>
          <Form.Item label="Rescale Min">
            <InputNumber
              value={rescaleMin}
              onChange={(value) => onRescaleMinChange(value as number)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/* Rescale Max */}
        <Col span={6}>
          <Form.Item label="Rescale Max">
            <InputNumber
              value={rescaleMax}
              onChange={(value) => onRescaleMaxChange(value as number)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/* Colormap */}
        <Col span={6}>
          <Form.Item label="Colormap">
            <Select
              value={selectedColormap}
              onChange={(value) => onColormapChange(value)}
            >
              <Option value="Internal">Internal</Option>
              <Option value="CFastie">CFastie</Option>
              <Option value="RPlumbo">RPlumbo</Option>
              <Option value="Schwarzwald">Schwarzwald</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Second Row */}
      <Row gutter={16}>
        {/* Color Formula */}
        <Col span={6}>
          <Form.Item label="Color Formula">
            <InputNumber
              value={colorFormula}
              onChange={(value) => onColorFormulaChange(value as string)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>

        {/* Resampling */}
        <Col span={6}>
          <Form.Item label="Resampling">
            <Select
              value={selectedResampling}
              onChange={(value) => onResamplingChange(value)}
            >
              <Option value="nearest">Nearest</Option>
              <Option value="bilinear">Bilinear</Option>
              <Option value="cubic">Cubic</Option>
              <Option value="cubic_spline">Cubic Spline</Option>
              <Option value="lanczos">Lanczos</Option>
              <Option value="average">Average</Option>
              <Option value="mode">Mode</Option>
              <Option value="gauss">Gauss</Option>
              <Option value="rms">RMS</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* NoData Value */}
        <Col span={6}>
          <Form.Item label="NoData Value">
            <InputNumber
              value={noDataValue}
              onChange={(value) => onNoDataValueChange(value as string)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Buttons Row */}
      <Row justify="center" style={{ marginTop: "16px" }}>
        <Col>
          <Button
            type="primary"
            onClick={onUpdateTileLayer}
            disabled={!hasChanges || loading}
            style={{ marginRight: "10px" }}
          >
            Update Tile Layer
          </Button>
          <Button onClick={onViewRenderingOptions}>View Rendering Options</Button>
        </Col>
      </Row>
    </Form>
  );
};

export default COGControlsForm;
