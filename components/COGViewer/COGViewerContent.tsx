import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { Map as LeafletMap } from 'leaflet';

import COGControlsForm from './COGControlsForm';
import RenderingOptionsModal from './RenderingOptionsModal';

// Dynamically import react-leaflet components to avoid SSR issues
import dynamic from 'next/dynamic';
const DynamicMap = dynamic(() => import('./DynamicMap'), { ssr: false });

interface COGViewerContentProps {
  metadata: any | null;
  tileUrl: string | null;
  loading: boolean;
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  selectedBands: number[];
  setSelectedBands: (bands: number[]) => void;
  rescale: [number | null, number | null][];
  setRescale: (rescale: [number | null, number | null][]) => void;
  selectedColormap: string;
  setSelectedColormap: (colormap: string) => void;
  colorFormula: string | null;
  setColorFormula: (formula: string | null) => void;
  selectedResampling: string | null;
  setSelectedResampling: (resampling: string | null) => void;
  noDataValue: string | null;
  setNoDataValue: (value: string | null) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  fetchTileUrl: (
    url: string,
    bands: number[],
    rescale: [number | null, number | null][],
    colormap: string,
    colorFormula?: string | null,
    resampling?: string | null,
    noData?: string | null
  ) => void;
  cogUrl: string | null;
  mapRef: React.MutableRefObject<LeafletMap | null>;
}

const COGViewerContent: React.FC<COGViewerContentProps> = ({
  metadata,
  tileUrl,
  loading,
  isModalVisible,
  setIsModalVisible,
  selectedBands,
  setSelectedBands,
  rescale,
  setRescale,
  selectedColormap,
  setSelectedColormap,
  colorFormula,
  setColorFormula,
  selectedResampling,
  setSelectedResampling,
  noDataValue,
  setNoDataValue,
  hasChanges,
  setHasChanges,
  fetchTileUrl,
  cogUrl,
  mapRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically adjust map size when container resizes
  useEffect(() => {
    if (!containerRef.current) {
      console.warn('Map container ref not available for ResizeObserver');
      return;
    }

    const mapContainerElement = containerRef.current; // Store ref value

    const resizeObserver = new ResizeObserver(() => {
      if (
        mapRef.current &&
        typeof mapRef.current.invalidateSize === 'function'
      ) {
        mapRef.current.invalidateSize();
      } else {
      }
    });

    resizeObserver.observe(mapContainerElement);

    return () => {
      resizeObserver.unobserve(mapContainerElement);
      resizeObserver.disconnect();
    };
  }, [mapRef]);

  return (
    <>
      {metadata && (
        <COGControlsForm
          metadata={metadata}
          selectedBands={selectedBands}
          rescale={rescale}
          selectedColormap={selectedColormap}
          colorFormula={colorFormula}
          selectedResampling={selectedResampling}
          noDataValue={noDataValue}
          hasChanges={hasChanges}
          onBandChange={(bandIndex, channel) => {
            const updatedBands = [...selectedBands];
            updatedBands[channel === 'R' ? 0 : channel === 'G' ? 1 : 2] =
              bandIndex;
            setSelectedBands(updatedBands);
            setHasChanges(true);
          }}
          onRescaleChange={(index, values) => {
            const updatedRescale = [...rescale];
            updatedRescale[index] = values;
            setRescale(updatedRescale);
            setHasChanges(true);
          }}
          onColormapChange={(value) => {
            setSelectedColormap(value);
            setHasChanges(true);
          }}
          onColorFormulaChange={(value) => {
            setColorFormula(value);
            setHasChanges(true);
          }}
          onResamplingChange={(value) => {
            setSelectedResampling(value);
            setHasChanges(true);
          }}
          onNoDataValueChange={(value) => {
            setNoDataValue(value);
            setHasChanges(true);
          }}
          onUpdateTileLayer={() => {
            if (cogUrl) {
              fetchTileUrl(
                cogUrl,
                selectedBands,
                rescale,
                selectedColormap,
                colorFormula,
                selectedResampling,
                noDataValue
              );
            } else {
              console.error('Cannot update tile layer: COG URL is null.');
            }
          }}
          onViewRenderingOptions={() => setIsModalVisible(true)}
          loading={loading}
        />
      )}
      <div
        ref={containerRef}
        style={{
          height: metadata ? '70vh' : '80vh',
          position: 'relative',
          border: '1px solid #d9d9d9',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        )}
        <DynamicMap tileUrl={tileUrl} mapRef={mapRef} />
      </div>

      {/* Rendering Options Modal */}
      <RenderingOptionsModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        options={{
          bidx: selectedBands.length > 1 ? selectedBands : [selectedBands[0]],
          rescale,
          colormap_name: selectedColormap.toLowerCase(),
          color_formula: colorFormula || undefined,
          resampling: selectedResampling || undefined,
          nodata: noDataValue || undefined,
        }}
      />
    </>
  );
};

export default COGViewerContent;
