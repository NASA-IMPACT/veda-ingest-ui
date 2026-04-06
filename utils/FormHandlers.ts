import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';

export const handleSubmit = (
  data: IChangeEvent<
    Record<string, unknown>,
    RJSFSchema,
    Record<string, unknown>
  >,
  onSubmit: (formData: Record<string, unknown>) => void
) => {
  if (onSubmit) {
    const updatedFormData = { ...data.formData };

    if (updatedFormData.temporal_extent) {
      const te = updatedFormData.temporal_extent as {
        startdate?: string;
        enddate?: string;
      };
      updatedFormData.temporal_extent = {
        startdate:
          te.startdate === '' || te.startdate === undefined
            ? null
            : te.startdate,
        enddate:
          te.enddate === '' || te.enddate === undefined ? null : te.enddate,
      };
    }

    onSubmit(updatedFormData as Record<string, unknown>);
  }
};
