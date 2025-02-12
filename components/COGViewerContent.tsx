import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';

import COGControlsForm from './COGControlsForm';
import RenderingOptionsModal from './RenderingOptionsModal';

// Dynamically import react-leaflet components to avoid SSR issues
import dynamic from 'next/dynamic';
const DynamicMap = dynamic(() => import('./DynamicMap'), { ssr: false });

interface COGViewerContentProps {
  metadata: any | null;
  tileUrl: string | null;
  loading: boolean;
  initialRenderOptions?: any;
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
  mapRef: React.MutableRefObject<any>;
}

const COGViewerContent: React.FC<COGViewerContentProps> = ({
  metadata,
  tileUrl,
  loading,
  initialRenderOptions,
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
  useEffect(() => {
    if (initialRenderOptions) {
      setSelectedBands(initialRenderOptions.bidx);
      setRescale(initialRenderOptions.rescale);
      setSelectedColormap(initialRenderOptions.colormap_name);
      setColorFormula(initialRenderOptions.color_formula);
      setSelectedResampling(initialRenderOptions.resampling);
      setNoDataValue(initialRenderOptions.nodata);
      setHasChanges(false);
    }
  }, [initialRenderOptions]);

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
          onUpdateTileLayer={() =>
            fetchTileUrl(
              cogUrl!,
              selectedBands,
              rescale,
              selectedColormap,
              colorFormula,
              selectedResampling,
              noDataValue
            )
          }
          onViewRenderingOptions={() => setIsModalVisible(true)}
          loading={loading}
        />
      )}
      <DynamicMap tileUrl={tileUrl} mapRef={mapRef} />
      <RenderingOptionsModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        options={{
          bidx: selectedBands.length > 1 ? selectedBands : [selectedBands[0]],
          rescale,
          colormap_name: selectedColormap.toLowerCase(),
          color_formula: colorFormula || undefined,
          resampling:
            selectedResampling !== 'nearest' ? selectedResampling : undefined,
          nodata: noDataValue || undefined,
        }}
      />
    </>
  );
};

export default COGViewerContent;
