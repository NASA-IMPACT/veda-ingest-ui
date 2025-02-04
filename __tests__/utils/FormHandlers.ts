import { describe, it, expect, vi } from "vitest";
import { handleSubmit } from "@/utils/FormHandlers";
import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";

describe("handleSubmit", () => {
  it("should convert empty startdate to null when field is missing", () => {
    const formData = {
      temporal_extent: {
        enddate: "2025-02-03T23:59:59.000Z",
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit({ formData } as unknown as IChangeEvent<any, RJSFSchema, any>, mockSubmit);

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: null,
        enddate: "2025-02-03T23:59:59.000Z",
      },
    });
  });

  it("should convert empty enddate to null when field is missing", () => {
    const formData = {
      temporal_extent: {
        startdate: "2025-02-03T00:00:00.000Z",
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit({ formData } as unknown as IChangeEvent<any, RJSFSchema, any>, mockSubmit);

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: "2025-02-03T00:00:00.000Z",
        enddate: null,
      },
    });
  });

  it("should correctly keep valid startdate and enddate values", () => {
    const formData = {
      temporal_extent: {
        startdate: "2025-02-03T00:00:00.000Z",
        enddate: "2025-02-03T23:59:59.999Z",
      },
    };

    const mockSubmit = vi.fn();
    handleSubmit({ formData } as unknown as IChangeEvent<any, RJSFSchema, any>, mockSubmit);

    expect(mockSubmit).toHaveBeenCalledWith({
      temporal_extent: {
        startdate: "2025-02-03T00:00:00.000Z",
        enddate: "2025-02-03T23:59:59.999Z",
      },
    });
  });
});
