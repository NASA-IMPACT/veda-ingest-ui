import Ajv from 'ajv';

export const rfc3339Regex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

// Helper to determine if a summary object should be treated as a JSON Schema
const isJsonSchemaType = (summaryData) => {
  if (
    summaryData &&
    typeof summaryData === 'object' &&
    !Array.isArray(summaryData)
  ) {
    // Check for keys that are highly indicative of a JSON Schema object
    return (
      summaryData.hasOwnProperty('$schema') ||
      summaryData.hasOwnProperty('properties') ||
      summaryData.hasOwnProperty('type')
    );
  }
  return false;
};

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
    // (Your existing date logic remains here...)
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

  // --- NEW: Validation logic for 'summaries' ---
  if (formData.summaries) {
    Object.keys(formData.summaries).forEach((key) => {
      const summaryItem = formData.summaries[key];

      // We only want to validate items that are supposed to be JSON Schemas.
      // Your custom field renders a string editor for this, so we check if the raw data is a string.
      if (typeof summaryItem === 'string') {
        try {
          const parsedSchema = JSON.parse(summaryItem);

          // Now, validate if the parsed object is a valid schema itself.
          const isValidSchema = ajv.validateSchema(parsedSchema);

          if (!isValidSchema) {
            // Add error to the specific summary item that is invalid
            errors.summaries?.[key]?.addError(
              'The text is not a valid JSON Schema object.'
            );
          }
        } catch (e) {
          // This catches errors from JSON.parse()
          errors.summaries?.[key]?.addError(
            'Invalid JSON format. Please check syntax.'
          );
        }
      }
      // This handles the case where the data is already an object (not from a text field)
      else if (isJsonSchemaType(summaryItem)) {
        const isValidSchema = ajv.validateSchema(summaryItem);
        if (!isValidSchema) {
          errors.summaries?.[key]?.addError(
            'The object is not a valid JSON Schema.'
          );
        }
      }
    });
  }

  return errors;
};
