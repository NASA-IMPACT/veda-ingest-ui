'use client';

import { useState, useEffect } from 'react';
import { Spin, Alert, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import EditFormManager from '@/components/ingestion/EditFormManager';

interface EditCollectionViewProps {
  collectionData: any;
  onComplete: () => void;
}

const EditCollectionView: React.FC<EditCollectionViewProps> = ({
  collectionData,
  onComplete,
}) => {
  const [formData, setFormData] = useState<any>(collectionData || {});
  const [status, setStatus] = useState<string>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!collectionData);

  // Sync formData with collectionData when it changes
  useEffect(() => {
    if (collectionData) {
      setFormData(collectionData);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [collectionData]);

  if (loading) {
    return <Spin tip="Loading collection..." />;
  }

  if (!formData || Object.keys(formData).length === 0) {
    return <Alert type="error" message="No collection data found." showIcon />;
  }

  return (
    <>
      <Button
        type="default"
        icon={<ArrowLeftOutlined />}
        onClick={onComplete}
        style={{ marginBottom: 16 }}
        aria-label="Back to collection list"
      >
        Back
      </Button>
      <EditFormManager
        formType="existingCollection"
        formData={formData}
        setFormData={setFormData}
        setStatus={setStatus}
        setApiErrorMessage={setApiErrorMessage}
        handleCancel={onComplete}
      />
    </>
  );
};

export default EditCollectionView;
