import { describe, it, expect, vi } from "vitest";
import { customValidate } from "@/utils/FormValidation";

describe("customValidate", () => {
  it("should validate a correct RFC 3339 datetime format", () => {
    const formData = {
      temporal_extent: {
        startdate: "2025-02-03T00:00:00.000Z",
        enddate: "2025-02-03T23:59:59.999Z",
      },
    };
    const errors: any = { temporal_extent: {} };
    customValidate(formData, errors);

    expect(errors.temporal_extent.startdate).toBeUndefined();
    expect(errors.temporal_extent.enddate).toBeUndefined();
  });

  it("should allow an empty string for startdate and enddate", () => {
    const formData = {
      temporal_extent: {
        startdate: "",
        enddate: "",
      },
    };
    const errors: any = { temporal_extent: {} };
    customValidate(formData, errors);

    expect(errors.temporal_extent.startdate).toBeUndefined();
    expect(errors.temporal_extent.enddate).toBeUndefined();
  });

  it("should return an error for invalid RFC 3339 datetime format", () => {
    const formData = {
      temporal_extent: {
        startdate: "2025-02-03 00:00:00",
        enddate: "2025-02-03 23:59:59",
      },
    };
    const errors: any = {
      temporal_extent: {
        startdate: { addError: vi.fn() },
        enddate: { addError: vi.fn() },
      },
    };

    customValidate(formData, errors);

    expect(errors.temporal_extent.startdate.addError).toHaveBeenCalledWith(
      "Start Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ) or empty."
    );
    expect(errors.temporal_extent.enddate.addError).toHaveBeenCalledWith(
      "End Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ) or empty."
    );
  });

  it("should allow null for startdate and enddate", () => {
    const formData = {
      temporal_extent: {
        startdate: null,
        enddate: null,
      },
    };
    const errors: any = { temporal_extent: {} };
    customValidate(formData, errors);
  
    expect(errors.temporal_extent.startdate).toBeUndefined();
    expect(errors.temporal_extent.enddate).toBeUndefined();
  });

  it("should validate correct JSON in the 'renders' field", () => {
    const formData = { renders: '{"key": "value"}' };
    const errors: any = { renders: {} };
    customValidate(formData, errors);

    expect(errors.renders).toEqual({}); // No errors for valid JSON
  });

  it("should return an error for invalid JSON in the 'renders' field", () => {
    const formData = { renders: '{invalid json}' };
    const errors: any = { renders: { addError: vi.fn() } };

    customValidate(formData, errors);

    expect(errors.renders.addError).toHaveBeenCalledWith("Invalid JSON format. Please enter a valid JSON object.");
  });
});
