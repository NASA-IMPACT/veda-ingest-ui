import Ajv from 'ajv';

export const rfc3339Regex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

// We create a new AJV instance here specifically to validate schemas
const ajv = new Ajv();

export const customValidate = (formData, errors) => {
  // --- Your existing validation logic for 'renders' ---
  try {
    if (formData.renders && formData.renders.dashboard) {
      const parsed = JSON.parse(formData.renders.dashboard);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        errors.renders?.dashboard.addError(
          'Input must be a valid JSON object.'
        );
      }
    }
  } catch {
    errors.renders?.dashboard?.addError(
      'Invalid JSON format. Please enter a valid JSON object.'
    );
  }

  // --- Your existing validation logic for 'temporal_extent' ---
  if (formData.temporal_extent) {
    const { startdate, enddate } = formData.temporal_extent;
    // ... your existing date logic ...
    if (startdate) {
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
    if (
      typeof startdate === 'string' &&
      startdate !== '' &&
      rfc3339Regex.test(startdate) &&
      typeof enddate === 'string' &&
      enddate !== '' &&
      rfc3339Regex.test(enddate)
    ) {
      const startDateObj = new Date(startdate);
      const endDateObj = new Date(enddate);
      if (startDateObj.getTime() >= endDateObj.getTime()) {
        errors.temporal_extent?.enddate?.addError(
          'End Date must be after Start Date.'
        );
      }
    }
  }

  // --- NEW and IMPROVED Validation logic for 'summaries' ---
  if (formData.summaries) {
    Object.keys(formData.summaries).forEach((key) => {
      const summaryItem = formData.summaries[key];

      // Validate 'JSON Schema' type
      if (typeof summaryItem === 'string') {
        try {
          const parsedSchema = JSON.parse(summaryItem);
          const isValidSchema = ajv.validateSchema(parsedSchema);
          if (!isValidSchema) {
            // Because this is a custom field, we add the error to the parent `summaries` object.
            errors.summaries.addError(
              `Summary '${key}' is not a valid JSON Schema object.`
            );
          }
        } catch (e) {
          errors.summaries.addError(`Summary '${key}' contains invalid JSON.`);
        }
      }
      // Validate 'Set of values' type
      else if (Array.isArray(summaryItem)) {
        // Your schema requires at least one item for this type.
        if (summaryItem.length === 0) {
          errors.summaries.addError(
            `Summary '${key}' is a 'Set of values' and must contain at least one value.`
          );
        }
      }
    });
  }

  return errors;
};
