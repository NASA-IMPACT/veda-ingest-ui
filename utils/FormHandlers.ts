import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";

export const handleSubmit = (
  data: IChangeEvent<any, RJSFSchema, any>,
  onSubmit: (formData: Record<string, unknown>) => void
) => {
  if (onSubmit) {
    const updatedFormData = { ...data.formData };

    if (updatedFormData.temporal_extent) {
      updatedFormData.temporal_extent = {
        startdate:
          updatedFormData.temporal_extent.startdate === "" || updatedFormData.temporal_extent.startdate === undefined
            ? null
            : updatedFormData.temporal_extent.startdate,
        enddate:
          updatedFormData.temporal_extent.enddate === "" || updatedFormData.temporal_extent.enddate === undefined
            ? null
            : updatedFormData.temporal_extent.enddate,
      };
    }

    onSubmit(updatedFormData as Record<string, unknown>);
  }
};

