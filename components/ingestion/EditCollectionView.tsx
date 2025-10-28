'use client';
import { useState } from 'react';
import { Card, Alert, Spin, Button } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';

import collectionSchema from '@/FormSchemas/collections/collectionSchema.json';
import collectionUiSchema from '@/FormSchemas/collections/uischema.json';

const Form = withTheme(AntDTheme);

interface EditCollectionViewProps {
  collectionData: any;
  onComplete: () => void;
}

const EditCollectionView: React.FC<EditCollectionViewProps> = ({
  collectionData,
  onComplete,
}) => {
  const [formData, setFormData] = useState<any>(collectionData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ formData }: any) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      // TODO: Replace with update API call or Github PR
      setSuccess(true);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      title={`Edit Collection: ${collectionData?.title || collectionData?.id}`}
    >
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {success && (
        <Alert
          type="success"
          message="Collection updated successfully!"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        schema={collectionSchema as JSONSchema7}
        uiSchema={collectionUiSchema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        onSubmit={handleSubmit}
        validator={validator}
        disabled={isSubmitting}
      >
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Save Changes
        </Button>
        <Button
          style={{ marginLeft: 8 }}
          onClick={onComplete}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </Form>
    </Card>
  );
};

export default EditCollectionView;
