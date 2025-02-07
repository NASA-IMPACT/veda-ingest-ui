import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customValidate } from '@/utils/formValidation';

describe('customValidate', () => {
  let mockErrors: any;

  beforeEach(() => {
    mockErrors = {
      renders: { addError: vi.fn() },
      temporal_extent: {
        startdate: { addError: vi.fn() },
        enddate: { addError: vi.fn() },
      },
    };

    vi.clearAllMocks();
  });

  // ✅ Tests for "renders" JSON validation
  it("should add an error if 'renders' is not valid JSON", () => {
    const formData = { renders: '{ invalid json' }; // 🚨 Invalid JSON

    customValidate(formData, mockErrors);

    expect(mockErrors.renders.addError).toHaveBeenCalledWith(
      'Invalid JSON format. Please enter a valid JSON object.'
    );
  });

  it("should add an error if 'renders' is a string but not a valid object", () => {
    const formData = { renders: JSON.stringify('invalid string') }; // 🚨 String instead of object

    customValidate(formData, mockErrors);

    expect(mockErrors.renders.addError).toHaveBeenCalledWith(
      'Input must be a valid JSON object.'
    );
  });

  it("should add an error if 'renders' is a number instead of an object", () => {
    const formData = { renders: JSON.stringify(12345) }; // 🚨 Number instead of object

    customValidate(formData, mockErrors);

    expect(mockErrors.renders.addError).toHaveBeenCalledWith(
      'Input must be a valid JSON object.'
    );
  });

  it("should not add an error if 'renders' is a valid JSON object", () => {
    const formData = { renders: JSON.stringify({ theme: 'dark' }) }; // ✅ Valid JSON object

    customValidate(formData, mockErrors);

    expect(mockErrors.renders.addError).not.toHaveBeenCalled();
  });

  it("should add an error if 'startdate' is not a string, null, or empty", () => {
    const formData = { temporal_extent: { startdate: 123 } }; //

    customValidate(formData, mockErrors);

    expect(mockErrors.temporal_extent.startdate.addError).toHaveBeenCalledWith(
      'Start Date must be a string, null, or in RFC 3339 format.'
    );
  });

  it("should add an error if 'startdate' is an invalid RFC 3339 string", () => {
    const formData = { temporal_extent: { startdate: 'invalid-date' } }; // 🚨 Invalid date format

    customValidate(formData, mockErrors);

    expect(mockErrors.temporal_extent.startdate.addError).toHaveBeenCalledWith(
      'Start Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ) or empty.'
    );
  });

  it("should add an error if 'enddate' is not a string, null, or empty", () => {
    const formData = { temporal_extent: { enddate: {} } }; // 🚨 Invalid object type

    customValidate(formData, mockErrors);

    expect(mockErrors.temporal_extent.enddate.addError).toHaveBeenCalledWith(
      'End Date must be a string, null, or in RFC 3339 format.'
    );
  });

  it("should add an error if 'enddate' is an invalid RFC 3339 string", () => {
    const formData = { temporal_extent: { enddate: 'not-a-date' } }; // 🚨 Invalid date format

    customValidate(formData, mockErrors);

    expect(mockErrors.temporal_extent.enddate.addError).toHaveBeenCalledWith(
      'End Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ) or empty.'
    );
  });

  it("should not add an error if 'startdate' and 'enddate' are null", () => {
    const formData = { temporal_extent: { startdate: null, enddate: null } }; // ✅ Valid case

    customValidate(formData, mockErrors);

    expect(
      mockErrors.temporal_extent.startdate.addError
    ).not.toHaveBeenCalled();
    expect(mockErrors.temporal_extent.enddate.addError).not.toHaveBeenCalled();
  });

  it("should not add an error if 'startdate' and 'enddate' are valid RFC 3339 strings", () => {
    const formData = {
      temporal_extent: {
        startdate: '2025-02-03T00:00:00.000Z',
        enddate: '2025-02-03T23:59:59.999Z',
      },
    };

    customValidate(formData, mockErrors);

    expect(
      mockErrors.temporal_extent.startdate.addError
    ).not.toHaveBeenCalled();
    expect(mockErrors.temporal_extent.enddate.addError).not.toHaveBeenCalled();
  });
});
