import React, { useCallback } from 'react';
import { FieldProps } from '@rjsf/utils';
import { InputNumber, Row, Col } from 'antd';

const BboxField: React.FC<FieldProps> = (props) => {
  const { formData, onChange, disabled, readonly, idSchema } = props;

  const bboxValue =
    Array.isArray(formData) && formData.length === 4
      ? formData
      : [null, null, null, null];

  const handleInputChange = useCallback(
    (index: number) => (newValue: number | null) => {
      const currentFormData =
        Array.isArray(props.formData) && props.formData.length === 4
          ? props.formData
          : [null, null, null, null];

      const newBboxValue = [...currentFormData];
      newBboxValue[index] = newValue;

      onChange(newBboxValue);
    },
    [props.formData, onChange, idSchema.$id]
  );

  return (
    <div id={idSchema.$id} style={{ marginBottom: '16px' }}>
      <Row gutter={[8, 8]} style={{ marginTop: '8px' }}>
        {/* Column for X values (xmin, xmax) */}
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <InputNumber
                placeholder="xmin"
                value={bboxValue[0]}
                onChange={handleInputChange(0)}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={24}>
              <InputNumber
                placeholder="xmax"
                value={bboxValue[2]}
                onChange={handleInputChange(2)}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Col>

        {/* Column for Y values (ymin, ymax) */}
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <InputNumber
                placeholder="ymin"
                value={bboxValue[1]}
                onChange={handleInputChange(1)}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={24}>
              <InputNumber
                placeholder="ymax"
                value={bboxValue[3]}
                onChange={handleInputChange(3)}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default BboxField;
