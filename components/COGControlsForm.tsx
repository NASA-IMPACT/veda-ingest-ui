import React from 'react';
import { useState, useEffect } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Input,
  Divider,
} from 'antd';

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
  onBandChange: (bandIndex: number, colorChannel: 'R' | 'G' | 'B') => void;
  onRescaleChange: (
    index: number,
    values: [number | null, number | null]
  ) => void;
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
  const [colorMapsList, setColorMapsList] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      selectedBands,
      rescale,
      selectedColormap,
      colorFormula,
      selectedResampling,
      noDataValue,
    });
  }, [
    selectedBands,
    rescale,
    selectedColormap,
    colorFormula,
    selectedResampling,
    noDataValue,
  ]);

  const bandOptions =
    metadata?.band_descriptions?.map((desc: any, index: number) => ({
      value: index + 1,
      label: `${desc[0]} - ${desc[1]}`,
    })) || [];

  // Ensure selectedBands has three values
  const filledSelectedBands = [
    selectedBands[0] || bandOptions[0]?.value || 1,
    selectedBands[1] || bandOptions[1]?.value || 1,
    selectedBands[2] || bandOptions[2]?.value || 1,
  ];

  const singleBand = metadata?.band_descriptions?.length === 1;

  const getColorMaps = async () => {
    try {
      const response = await fetch(
        'https://staging.openveda.cloud/api/raster/colorMaps'
      );
      const data = await response.json();
      setColorMapsList(['Internal', ...data.colorMaps]);
    } catch (error) {
      console.error('Failed to fetch color maps:', error);
      setColorMapsList(['Internal']);
    }
  };

  useEffect(() => {
    getColorMaps();
  }, []);

  return (
    <Form layout="vertical" form={form}>
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
        /* RGB Band Selectors for MultiBand COGs */
        <Row gutter={16}>
          {['R', 'G', 'B'].map((channel, index) => (
            <Col key={channel} span={8}>
              <Form.Item
                label={`Band (${channel})`}
                htmlFor={`band-${channel}`}
              >
                <Select
                  id={`band-${channel}`}
                  data-testid={`band-${channel}`}
                  value={filledSelectedBands[index]}
                  onChange={(value) =>
                    onBandChange(value, channel as 'R' | 'G' | 'B')
                  }
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
                    onRescaleChange(index, [
                      value !== null ? value : null,
                      values[1],
                    ])
                  }
                  placeholder="Min"
                  style={{ width: '45%', marginRight: '10%' }}
                />
                <InputNumber
                  value={values[1]}
                  onChange={(value) =>
                    onRescaleChange(index, [
                      values[0],
                      value !== null ? value : null,
                    ])
                  }
                  placeholder="Max"
                  style={{ width: '45%' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Colormap" name="selectedColormap">
            <Select onChange={onColormapChange} data-testid="colormap">
              {colorMapsList.map((colorMap) => (
                <Option key={colorMap} value={colorMap}>
                  {colorMap}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Color Formula" name="colorFormula">
            <Input
              id="colorFormula"
              onChange={(e) => onColorFormulaChange(e.target.value || null)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Resampling" name="selectedResampling">
            <Select data-testid="resampling" onChange={onResamplingChange}>
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
          <Form.Item label="Nodata Value" name="noDataValue">
            <InputNumber
              onChange={(value) =>
                onNoDataValueChange(value !== null ? String(value) : null)
              }
            />
          </Form.Item>
        </Col>
      </Row>

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
          <Button onClick={onViewRenderingOptions} block>
            View Rendering Options
          </Button>
        </Col>
      </Row>
      <Divider />
    </Form>
  );
};

export default COGControlsForm;
