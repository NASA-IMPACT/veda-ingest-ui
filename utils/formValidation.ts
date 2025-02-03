export const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const customValidate = (formData: any, errors: any) => {
  try {
    // Validate "renders" JSON format
    if (formData.renders) {
      const parsed = JSON.parse(formData.renders);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        errors.renders?.addError("Input must be a valid JSON object.");
      }
    }

    // Validate Temporal Extent (Startdate & Enddate)
    if (formData.temporal_extent) {
      if (formData.temporal_extent.startdate && !rfc3339Regex.test(formData.temporal_extent.startdate)) {
        errors.temporal_extent?.startdate?.addError("Start Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ)");
      }
      if (formData.temporal_extent.enddate && !rfc3339Regex.test(formData.temporal_extent.enddate)) {
        errors.temporal_extent?.enddate?.addError("End Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ss.sssZ)");
      }
    }
  } catch {
    errors.renders?.addError("Invalid JSON format. Please enter a valid JSON object.");
  }

  return errors;
};
