import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCogValidation } from '@/hooks/useCogValidation';

// Mock fetch globally
global.fetch = vi.fn();

describe('useCogValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useCogValidation());

    expect(result.current.isCogValidationModalVisible).toBe(false);
    expect(result.current.isValidatingCog).toBe(false);
    expect(typeof result.current.showCogValidationModal).toBe('function');
    expect(typeof result.current.hideCogValidationModal).toBe('function');
    expect(typeof result.current.validateFormDataCog).toBe('function');
  });

  it('should show and hide COG validation modal', () => {
    const { result } = renderHook(() => useCogValidation());

    // Initially hidden
    expect(result.current.isCogValidationModalVisible).toBe(false);

    // Show modal
    act(() => {
      result.current.showCogValidationModal();
    });
    expect(result.current.isCogValidationModalVisible).toBe(true);

    // Hide modal
    act(() => {
      result.current.hideCogValidationModal();
    });
    expect(result.current.isCogValidationModalVisible).toBe(false);
  });

  describe('validateFormDataCog', () => {
    it('should return true for collection forms (no validation needed)', async () => {
      const { result } = renderHook(() => useCogValidation());

      const formData = { sample_files: 'http://example.com/file.tif' };
      const isValid = await result.current.validateFormDataCog(
        formData,
        'collection'
      );

      expect(isValid).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return true for dataset forms without sample_files', async () => {
      const { result } = renderHook(() => useCogValidation());

      const formData = { title: 'Test Dataset' };
      const isValid = await result.current.validateFormDataCog(
        formData,
        'dataset'
      );

      expect(isValid).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return true for dataset forms with empty sample_files', async () => {
      const { result } = renderHook(() => useCogValidation());

      const formData = { sample_files: '' };
      const isValid = await result.current.validateFormDataCog(
        formData,
        'dataset'
      );

      expect(isValid).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate COG URL for dataset with sample_files (string)', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });
      const { result } = renderHook(() => useCogValidation());

      const formData = { sample_files: 'http://example.com/file.tif' };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      expect(isValid!).toBe(true);
      const { VEDA_BACKEND_URL } = await import('@/config/env');
      expect(global.fetch).toHaveBeenCalledWith(
        `${VEDA_BACKEND_URL}/raster/cog/validate?strict=false&url=http%3A%2F%2Fexample.com%2Ffile.tif`
      );
    });

    it('should validate COG URL for dataset with sample_files (array)', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });
      const { result } = renderHook(() => useCogValidation());

      const formData = {
        sample_files: [
          'http://example.com/file1.tif',
          'http://example.com/file2.tif',
        ],
      };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      expect(isValid!).toBe(true);
      const { VEDA_BACKEND_URL } = await import('@/config/env');
      expect(global.fetch).toHaveBeenCalledWith(
        `${VEDA_BACKEND_URL}/raster/cog/validate?strict=false&url=http%3A%2F%2Fexample.com%2Ffile1.tif`
      );
    });

    it('should return false when COG validation fails', async () => {
      (global.fetch as any).mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useCogValidation());

      const formData = { sample_files: 'http://example.com/invalid.tif' };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      expect(isValid!).toBe(false);
    });

    it('should return false when COG validation throws an error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { result } = renderHook(() => useCogValidation());

      const formData = { sample_files: 'http://example.com/file.tif' };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      expect(isValid!).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'COG validation API request failed',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should complete validation successfully and reset loading state', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useCogValidation());
      const formData = { sample_files: 'http://example.com/file.tif' };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      // Should be valid and not loading after completion
      expect(isValid!).toBe(true);
      expect(result.current.isValidatingCog).toBe(false);
    });

    it('should reset loading state even if validation fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useCogValidation());
      const formData = { sample_files: 'http://example.com/file.tif' };

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateFormDataCog(formData, 'dataset');
      });

      // Should be invalid and not loading after completion
      expect(isValid!).toBe(false);
      expect(result.current.isValidatingCog).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
