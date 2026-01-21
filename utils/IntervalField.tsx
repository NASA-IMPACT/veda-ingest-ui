import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/plugin/utc';
import 'dayjs/plugin/timezone';

dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

const IntervalField: React.FC<FieldProps> = (props) => {
  const { formData, onChange, disabled, readonly, fieldPathId } = props;

  // Ensure formData is an array, default to [null, null] if undefined
  const intervalValue =
    Array.isArray(formData) && formData.length === 2 ? formData : [null, null];

  const startDayjs = intervalValue[0] ? dayjs(intervalValue[0]) : null;
  const endDayjs = intervalValue[1] ? dayjs(intervalValue[1]) : null;

  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    const newIntervalValue = [...intervalValue];
    newIntervalValue[0] = date
      ? date.utc().format('YYYY-MM-DD HH:mm:ss+00:00')
      : null;
    onChange(newIntervalValue, fieldPathId.path);
  };

  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    const newIntervalValue = [...intervalValue];
    newIntervalValue[1] = date
      ? date.utc().format('YYYY-MM-DD HH:mm:ss+00:00')
      : null;
    onChange(newIntervalValue, fieldPathId.path);
  };

  const displayFormat = 'YYYY-MM-DD HH:mm:ss';

  return (
    <div id={fieldPathId.$id}>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <DatePicker
                placeholder="Start Date"
                showTime
                value={startDayjs}
                onChange={handleStartDateChange}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
                format={displayFormat}
              />
            </Col>
            <Col span={24}>
              <DatePicker
                placeholder="End Date"
                showTime
                value={endDayjs}
                onChange={handleEndDateChange}
                disabled={disabled || readonly}
                style={{ width: '100%' }}
                format={displayFormat}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default IntervalField;
