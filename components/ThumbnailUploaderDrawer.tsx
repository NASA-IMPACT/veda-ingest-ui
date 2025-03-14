import { Drawer } from 'antd';
import ThumbnailUploader from '@/components/ThumbnailUploader';

interface ThumbnailUploaderDrawerProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (s3Uri: string) => void;
}

const ThumbnailUploaderDrawer: React.FC<ThumbnailUploaderDrawerProps> = ({
  open,
  onClose,
  onUploadSuccess,
}) => {
  return (
    <Drawer
      title="Upload Thumbnail To S3"
      placement="right"
      onClose={onClose}
      open={open}
      width={'80%'}
    >
      <ThumbnailUploader insideDrawer onUploadSuccess={onUploadSuccess} />
    </Drawer>
  );
};

export default ThumbnailUploaderDrawer;
