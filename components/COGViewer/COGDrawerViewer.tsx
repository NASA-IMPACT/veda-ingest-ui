import React, { useEffect, useRef } from 'react';
import { Drawer, Button } from 'antd';
import { useCOGViewer } from '@/hooks/useCOGViewer';
import dynamic from 'next/dynamic';

// Dynamically load the COGViewerContent component to prevent SSR issues
const COGViewerContent = dynamic(
  () => import('@/components/COGViewer/COGViewerContent'),
  {
    ssr: false,
  }
);

interface COGDrawerViewerProps {
  url: string;
  drawerOpen: boolean;
  onClose: () => void;
  onAcceptRenderOptions: (options: string) => void;
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
  const { setCogUrl, fetchMetadata } = cogViewer;

  // Use a ref so the effect doesn't re-fire when fetchMetadata's identity changes
  const fetchMetadataRef = useRef(fetchMetadata);
  fetchMetadataRef.current = fetchMetadata;

  useEffect(() => {
    if (drawerOpen && url) {
      setCogUrl(url);

      // Ensure we pass the latest renders object
      if (renders) {
        fetchMetadataRef.current(url, renders);
      } else {
        fetchMetadataRef.current(url, null);
      }
    }
  }, [drawerOpen, url, renders, setCogUrl]);

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
      ...(cogViewer.selectedResampling != null && {
        resampling: cogViewer.selectedResampling,
      }),
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
      <COGViewerContent {...cogViewer} />
    </Drawer>
  );
};

export default COGDrawerViewer;
