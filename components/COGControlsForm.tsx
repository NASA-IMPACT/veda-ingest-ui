import React from "react";
import { Button, Select, Form, Row, Col } from "antd";

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
        <>
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
        </>
      )}

      {/* Rescale, Colormap, and Buttons */}
      <Row gutter={16}>
        {/* Rescale Min */}
        <Col span={6}>
          <Form.Item label="Rescale Min">
            <Select value={rescaleMin} onChange={(value) => onRescaleMinChange(value)} />
          </Form.Item>
        </Col>
        {/* Rescale Max */}
        <Col span={6}>
          <Form.Item label="Rescale Max">
            <Select value={rescaleMax} onChange={(value) => onRescaleMaxChange(value)} />
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
