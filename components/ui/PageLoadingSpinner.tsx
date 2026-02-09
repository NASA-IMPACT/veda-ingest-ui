import { Spin } from 'antd';

export default function PageLoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        width: '100%',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
