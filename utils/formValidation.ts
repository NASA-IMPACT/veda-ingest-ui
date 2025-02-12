export const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const customValidate = (formData: any, errors: any) => {
  try {
    // Validate "renders" JSON format
    if (formData.renders.dashboard) {
      const parsed = JSON.parse(formData.renders.dashboard);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        errors.renders?.dashboard.addError('Input must be a valid JSON object.');
      }
    }

  } catch {
    errors.renders.dashboard?.addError(
      'Invalid JSON format. Please enter a valid JSON object.'
    );
  }

      // Allow `null` or empty strings for `startdate` and `enddate`
      if (formData.temporal_extent) {
        const { startdate, enddate } = formData.temporal_extent;
        if(startdate) {
          if (
            startdate !== null &&
            startdate !== '' &&
            typeof startdate !== 'string'
          ) {
            errors.temporal_extent?.startdate?.addError(
              'Start Date must be a string, null, or in RFC 3339 format.'
            );
          } else if (
            typeof startdate === 'string' &&
            !rfc3339Regex.test(startdate)
          ) {
            errors.temporal_extent?.startdate?.addError(
              'Start Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ssZ) or empty.'
            );
          }
        }
  
        if (enddate) {
          if (enddate !== null && enddate !== '' && typeof enddate !== 'string') {
            errors.temporal_extent?.enddate?.addError(
              'End Date must be a string, null, or in RFC 3339 format.'
            );
          } else if (typeof enddate === 'string' && !rfc3339Regex.test(enddate)) {
            errors.temporal_extent?.enddate?.addError(
              'End Date must be in RFC 3339 format (YYYY-MM-DDTHH:mm:ssZ) or empty.'
            );
          }
        }
      }

  return errors;
};
