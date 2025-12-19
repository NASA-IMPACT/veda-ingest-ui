import { useState } from 'react';
import { VEDA_BACKEND_URL } from '@/config/env';

interface UseCogValidationReturn {
  isCogValidationModalVisible: boolean;
  isValidatingCog: boolean;
  showCogValidationModal: () => void;
  hideCogValidationModal: () => void;
  validateFormDataCog: (
    formData: Record<string, unknown>,
    formType: 'dataset' | 'collection'
  ) => Promise<boolean>;
}

export const useCogValidation = (): UseCogValidationReturn => {
  const [isCogValidationModalVisible, setIsCogValidationModalVisible] =
    useState(false);
  const [isValidatingCog, setIsValidatingCog] = useState(false);

  const validateCogUrl = async (url: string): Promise<boolean> => {
    if (!url) return true; // Skip validation if no URL provided

    const encodedUrl = encodeURIComponent(url);
    const validationApiUrl = `${VEDA_BACKEND_URL}/raster/cog/validate?strict=false&url=${encodedUrl}`;

    try {
      const response = await fetch(validationApiUrl);
      return response.ok;
    } catch (err) {
      console.error('COG validation API request failed', err);
      return false;
    }
  };

  const validateFormDataCog = async (
    formData: Record<string, unknown>,
    formType: 'dataset' | 'collection'
  ): Promise<boolean> => {
    if (formType !== 'dataset' || !formData.sample_files) {
      return true;
    }

    const sampleFiles = formData.sample_files as string | string[];
    const sampleFileUrl = Array.isArray(sampleFiles)
      ? sampleFiles[0]
      : sampleFiles;

    if (!sampleFileUrl) {
      return true;
    }

    setIsValidatingCog(true);
    try {
      return await validateCogUrl(sampleFileUrl);
    } finally {
      setIsValidatingCog(false);
    }
  };

  const showCogValidationModal = () => {
    setIsCogValidationModalVisible(true);
  };

  const hideCogValidationModal = () => {
    setIsCogValidationModalVisible(false);
  };

  return {
    isCogValidationModalVisible,
    isValidatingCog,
    showCogValidationModal,
    hideCogValidationModal,
    validateFormDataCog,
  };
};
