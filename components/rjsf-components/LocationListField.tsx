'use client';

import React from "react";
import { FieldProps } from '@rjsf/utils';
import { Typography } from 'antd';

const { Text } = Typography;

const LocationListField: React.FC<FieldProps> = (props) => {
  const { formData, registry } = props;
  const { ArrayField } = registry.fields;

  const previewValue = Array.isArray(formData)
    ? (formData as unknown[]).filter(Boolean).join(', ')
    : '';

  return (
    <div>
      <ArrayField {...props} />
      {previewValue && (
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          Preview: {previewValue}
        </Text>
      )}
    </div>
  );
};

export default LocationListField;