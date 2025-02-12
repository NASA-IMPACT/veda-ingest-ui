import React, { useEffect } from 'react';
import { Drawer, Button, message, Spin } from 'antd';
import { useCOGViewer } from '@/hooks/useCOGViewer';
import dynamic from 'next/dynamic';

// Dynamically load the COGViewerContent component to prevent SSR issues
const COGViewerContent = dynamic(
  () => import('@/components/COGViewerContent'),
  {
    ssr: false,
  }
);

interface COGDrawerViewerProps {
  url: string;
  drawerOpen: boolean;
  onClose: () => void;
  onAcceptRenderOptions: (options: string) => void;
  formContext?: any;
  renders?: string | null;
}

const COGDrawerViewer: React.FC<COGDrawerViewerProps> = ({
  url,
  drawerOpen,
  onClose,
  onAcceptRenderOptions,
  renders,
}) => {
  const cogViewer = useCOGViewer();

  useEffect(() => {
    if (drawerOpen && url) {
      cogViewer.setCogUrl(url);
      
      // Ensure we pass the latest renders object
      if (renders) {
        cogViewer.fetchMetadata(url, renders); 
      } else {
        cogViewer.fetchMetadata(url, null);
      }
    }
  }, [drawerOpen, url, renders]);
  

  const handleAccept = () => {
    if (!onAcceptRenderOptions) {
      console.error(
        '❌ onAcceptRenderOptions function is missing in COGDrawerViewer.'
      );
      return;
    }

    const renderOptions = {
      bidx: cogViewer.selectedBands,
      rescale: cogViewer.rescale.filter(
        (pair) => pair[0] !== null && pair[1] !== null
      ),
      colormap_name:
        cogViewer.selectedColormap !== 'Internal'
          ? cogViewer.selectedColormap
          : undefined,
      color_formula: cogViewer.colorFormula || undefined,
      resampling:
        cogViewer.selectedResampling !== 'nearest'
          ? cogViewer.selectedResampling
          : undefined,
      nodata: cogViewer.noDataValue || undefined,
      assets: ['cog_default'], // Ensure assets are included
    };

    const renderOptionsJSON = JSON.stringify(renderOptions, null, 2);

    onAcceptRenderOptions(renderOptionsJSON);

    onClose();
  };

  return (
    <Drawer
      title="COG Rendering Options"
      placement="right"
      size="large"
      onClose={onClose}
      open={drawerOpen}
      width={'80%'}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleAccept}>
            Accept Render Options
          </Button>
        </div>
      }
    >
      {cogViewer.loading && <Spin tip="Loading COG..." />}
      <COGViewerContent {...cogViewer} />
    </Drawer>
  );
};

export default COGDrawerViewer;
