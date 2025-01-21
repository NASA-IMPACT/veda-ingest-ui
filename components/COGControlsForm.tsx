import React from "react";
import { Button, InputNumber, Select, Form, Row, Col, Input } from "antd";

const { Option } = Select;

interface COGControlsFormProps {
  metadata: any;
  selectedBands: number[]; // [R, G, B]
  rescaleMin: number | null;
  rescaleMax: number | null;
  selectedColormap: string;
  colorFormula: string;
  selectedResampling: string;
  noDataValue: string;
  hasChanges: boolean;
  onBandChange: (bandIndex: number, colorChannel: "R" | "G" | "B") => void;
  onRescaleMinChange: (value: number | null) => void;
  onRescaleMaxChange: (value: number | null) => void;
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
  selectedBands,
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
  const hasMultipleBands = metadata?.band_descriptions?.length > 1;

  return (
    <Form layout="vertical">
      {/* RGB Band Selection */}
      {hasMultipleBands && (
        <Row gutter={16}>
          {/* R Band */}
          <Col span={8}>
            <Form.Item label="R Band">
              <Select
                value={selectedBands[0]}
                onChange={(value) => onBandChange(value, "R")}
              >
                {metadata.band_descriptions.map(([band, description]: [string, string], index: number) => (
                  <Option key={index} value={index + 1}>
                    {`${band} - ${description}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* G Band */}
          <Col span={8}>
            <Form.Item label="G Band">
              <Select
                value={selectedBands[1]}
                onChange={(value) => onBandChange(value, "G")}
              >
                {metadata.band_descriptions.map(([band, description]: [string, string], index: number) => (
                  <Option key={index} value={index + 1}>
                    {`${band} - ${description}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* B Band */}
          <Col span={8}>
            <Form.Item label="B Band">
              <Select
                value={selectedBands[2]}
                onChange={(value) => onBandChange(value, "B")}
              >
                {metadata.band_descriptions.map(([band, description]: [string, string], index: number) => (
                  <Option key={index} value={index + 1}>
                    {`${band} - ${description}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* Rescale Min and Max */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Rescale Min">
            <InputNumber
              value={rescaleMin ?? undefined}
              onChange={(value) => onRescaleMinChange(value)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Rescale Max">
            <InputNumber
              value={rescaleMax ?? undefined}
              onChange={(value) => onRescaleMaxChange(value)}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Colormap */}
      <Row gutter={16}>
        <Col span={8}>
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

        {/* Color Formula */}
        <Col span={8}>
          <Form.Item label="Color Formula">
            <Input
              value={colorFormula}
              onChange={(e) => onColorFormulaChange(e.target.value)}
              placeholder="e.g., gamma RGB 2.2"
            />
          </Form.Item>
        </Col>

        {/* Resampling */}
        <Col span={8}>
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
      </Row>

      {/* NoData */}
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="NoData Value">
            <Input
              value={noDataValue}
              onChange={(e) => onNoDataValueChange(e.target.value)}
              placeholder="e.g., -9999"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Buttons */}
      <Row justify="center" style={{ marginTop: "16px" }}>
        <Button
          type="primary"
          onClick={onUpdateTileLayer}
          disabled={!hasChanges || loading}
          style={{ marginRight: "10px" }}
        >
          Update Tile Layer
        </Button>
        <Button onClick={onViewRenderingOptions}>View Rendering Options</Button>
      </Row>
    </Form>
  );
};

export default COGControlsForm;
