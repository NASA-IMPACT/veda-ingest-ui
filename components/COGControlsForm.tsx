import React from "react";
import { Form, InputNumber, Select, Button, Row, Col, Card, Typography, Input } from "antd";

const { Option } = Select;
const { Title } = Typography;

interface COGControlsFormProps {
  metadata: any;
  selectedBands: number[];
  rescale: [number | null, number | null][];
  selectedColormap: string;
  colorFormula: string | null;
  selectedResampling: string | null;
  noDataValue: string | null;
  hasChanges: boolean;
  onBandChange: (bandIndex: number, colorChannel: "R" | "G" | "B") => void;
  onRescaleChange: (index: number, values: [number | null, number | null]) => void;
  onColormapChange: (value: string) => void;
  onColorFormulaChange: (value: string | null) => void;
  onResamplingChange: (value: string | null) => void;
  onNoDataValueChange: (value: string | null) => void;
  onUpdateTileLayer: () => void;
  onViewRenderingOptions: () => void;
  loading: boolean;
}

const COGControlsForm: React.FC<COGControlsFormProps> = ({
  metadata,
  selectedBands,
  rescale,
  selectedColormap,
  colorFormula,
  selectedResampling,
  noDataValue,
  hasChanges,
  onBandChange,
  onRescaleChange,
  onColormapChange,
  onColorFormulaChange,
  onResamplingChange,
  onNoDataValueChange,
  onUpdateTileLayer,
  onViewRenderingOptions,
  loading,
}) => {
  const bandOptions = metadata.band_descriptions.map((desc: any, index: number) => ({
    value: index + 1,
    label: `${desc[0]} - ${desc[1]}`,
  }));

  const singleBand = metadata.band_descriptions.length === 1;

  return (
    <Form layout="vertical">
      {/* Single Band Heading */}
      {singleBand ? (
        <Row>
          <Col span={24}>
            <Title level={5}>
              Band: {metadata.band_descriptions[0][1]} (Index: 1)
            </Title>
          </Col>
        </Row>
      ) : (
        /* RGB Band Selectors */
        <Row gutter={16}>
          {["R", "G", "B"].map((channel, index) => (
            <Col key={channel} span={8}>
              <Form.Item label={`Band (${channel})`} htmlFor={`band-${channel}`}>
                <Select
                  id={`band-${channel}`}
                  data-testid={`band-${channel}`}
                  value={selectedBands[index]}
                  onChange={(value) => onBandChange(value, channel as "R" | "G" | "B")}
                  options={bandOptions}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      )}

      {/* Rescale Inputs */}
      <Form.Item label="Rescale">
        <Row gutter={16}>
          {rescale.map((values, index) => (
            <Col key={`rescale-${index}`} span={6}>
              <Card size="small" title={`Band ${index + 1}`}>
                <InputNumber
                  value={values[0]}
                  onChange={(value) =>
                    onRescaleChange(index, [value !== null ? value : null, values[1]])
                  }
                  placeholder="Min"
                  style={{ width: "45%", marginRight: "10%" }}
                />
                <InputNumber
                  value={values[1]}
                  onChange={(value) =>
                    onRescaleChange(index, [values[0], value !== null ? value : null])
                  }
                  placeholder="Max"
                  style={{ width: "45%" }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Form.Item>

      {/* Other Inputs */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Colormap" htmlFor="colormap">
            <Select
              id="colormap"
              data-testid="colormap"
              value={selectedColormap}
              onChange={onColormapChange}
            >
              <Option value="Internal">Internal</Option>
              <Option value="CFastie">CFastie</Option>
              <Option value="RPlumbo">RPlumbo</Option>
              <Option value="Schwarzwald">Schwarzwald</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
        <Form.Item label="Color Formula" htmlFor="colorFormula">
          <Input
            id="colorFormula"
            value={colorFormula || ""} 
            onChange={(e) => {
              const newValue = e.target.value;
              onColorFormulaChange(newValue || null); // Pass `null` if the input is empty
            }}
            style={{ width: "100%" }}
          />
        </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Resampling" htmlFor="resampling">
            <Select
              id="resampling"
              data-testid="resampling"
              value={selectedResampling}
              onChange={onResamplingChange}
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
        <Col span={12}>
          <Form.Item label="Nodata Value" htmlFor="nodata">
            <InputNumber
              id="nodata"
              value={noDataValue !== null ? Number(noDataValue) : undefined}
              onChange={(value) =>
                onNoDataValueChange(value !== null ? String(value) : null)
              }
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Buttons */}
      <Row gutter={16} justify="center">
        <Col span={12}>
          <Button
            type="primary"
            onClick={onUpdateTileLayer}
            disabled={!hasChanges || loading}
            block
          >
            Update Tile Layer
          </Button>
        </Col>
        <Col span={12}>
          <Button
            onClick={onViewRenderingOptions}
            block
          >
            View Rendering Options
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default COGControlsForm;
