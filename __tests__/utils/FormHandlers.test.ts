import { describe, it, expect, vi } from 'vitest';
import { handleSubmit } from '@/utils/FormHandlers';
import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';

describe('handleSubmit', () => {

  it('should allow startdate and enddate with YYYY-MM-DDT00:00:00.000Z format', () => {
    const formData = {
      temporal_extent: {
        startdate: '2000-01-01T00:00:00.123Z',
        enddate: '2000-01-01T00:00:00.123Z',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: '2000-01-01T00:00:00.123Z',
        enddate: '2000-01-01T00:00:00.123Z',
      },
    });
  });

  it('should allow startdate and enddate with YYYY-MM-DDT00:00:00Z format', () => {
    const formData = {
      temporal_extent: {
        startdate: '2000-01-01T00:00:00Z',
        enddate: '2000-01-01T00:00:00Z',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: '2000-01-01T00:00:00Z',
        enddate: '2000-01-01T00:00:00Z',
      },
    });
  });
  it('should convert empty startdate to null when field is missing', () => {
    const formData = {
      temporal_extent: {
        enddate: '2025-02-03T23:59:59.000Z',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: '2025-02-03T23:59:59.000Z',
      },
    });
  });

  it('should convert empty enddate to null when field is missing', () => {
    const formData = {
      temporal_extent: {
        startdate: '2025-02-03T00:00:00.000Z',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: '2025-02-03T00:00:00.000Z',
        enddate: null,
      },
    });
  });

  it('should convert both empty startdate and enddate strings to null', () => {
    const formData = {
      temporal_extent: {
        startdate: '',
        enddate: '',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    });
  });

  it('should set missing startdate and enddate strings to null', () => {
    const formData = {
      temporal_extent: {},
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    });
  });

  it('should correctly keep valid startdate and enddate values', () => {
    const formData = {
      temporal_extent: {
        startdate: '2025-02-03T00:00:00.000Z',
        enddate: '2025-02-03T23:59:59.999Z',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: '2025-02-03T00:00:00.000Z',
        enddate: '2025-02-03T23:59:59.999Z',
      },
    });
  });

  // 🔹 New test: Handle when `temporal_extent` is completely missing
  it('should handle missing temporal_extent gracefully', () => {
    const formData = {};

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({});
  });

  it('should convert empty startdate and enddate strings to null', () => {
    const formData = {
      temporal_extent: {
        startdate: '',
        enddate: '',
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    });
  });

  it('should keep both startdate and enddate as null if already null', () => {
    const formData = {
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    });
  });

  it('should convert both undefined startdate and enddate to null', () => {
    const formData = {
      temporal_extent: {
        startdate: undefined,
        enddate: undefined,
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit(
      { formData } as unknown as IChangeEvent<any, RJSFSchema, any>,
      mockSubmit
    );

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    });
  });
});
