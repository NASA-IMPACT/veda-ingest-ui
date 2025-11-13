/**
 * STAC Collection Data Sanitization Utilities
 *
 * This module provides sanitization functions to clean STAC collection data
 * to ensure it complies with the STAC schema validation requirements.
 *
 * Primary use cases:
 * - Converting null values to appropriate empty arrays/objects
 * - Fixing datetime format issues in temporal extents
 * - Ensuring field types match STAC schema expectations
 */

/**
 * Define which fields should be arrays when they're null
 */
function shouldBeArray(fieldName: string): boolean {
  const arrayFields = ['stac_extensions', 'keywords', 'providers', 'links'];
  return arrayFields.includes(fieldName);
}

/**
 * Define which fields should be objects when they're null
 */
function shouldBeObject(fieldName: string): boolean {
  const objectFields = ['assets', 'item_assets', 'summaries'];
  return objectFields.includes(fieldName);
}

/**
 * Fix datetime format to comply with STAC schema
 * Handles common datetime format issues in temporal extent data
 */
function sanitizeDatetime(dateStr: string): string {
  // Fix timezone format: +00 -> +00:00 and ensure T separator
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}\+00$/)) {
    return dateStr.replace(' ', 'T').replace('+00', '+00:00');
  }

  // Ensure T separator for datetime strings
  if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
    return dateStr.replace(' ', 'T');
  }

  return dateStr;
}

/**
 * Recursively sanitize STAC collection form data
 *
 * @param data - The data to sanitize (can be object, array, or primitive)
 * @returns Sanitized data with null values converted and datetime formats fixed
 */
function sanitizeFormData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeFormData);
  } else if (data && typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert null values to empty arrays for fields that should be arrays
      if (value === null && shouldBeArray(key)) {
        sanitized[key] = [];
      }
      // Convert null values to empty objects for fields that should be objects
      else if (value === null && shouldBeObject(key)) {
        sanitized[key] = {};
      } else {
        sanitized[key] = sanitizeFormData(value);
      }
    }
    return sanitized;
  } else if (typeof data === 'string') {
    // Fix datetime format issues for existing data that wasn't processed by IntervalField
    return sanitizeDatetime(data);
  }

  return data;
}

/**
 * Helper function to identify what changes were made during sanitization
 * Useful for debugging and logging purposes
 *
 * @param original - Original data before sanitization
 * @param sanitized - Data after sanitization
 * @returns Array of change descriptions
 */
function findSanitizationChanges(original: any, sanitized: any): string[] {
  const changes: string[] = [];

  function findChanges(orig: any, san: any, path = ''): void {
    if (Array.isArray(orig) && Array.isArray(san)) {
      return; // Arrays should be processed the same
    }

    if (orig && san && typeof orig === 'object' && typeof san === 'object') {
      for (const [key, origValue] of Object.entries(orig)) {
        const sanValue = (san as Record<string, any>)[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (origValue === null && Array.isArray(sanValue)) {
          changes.push(`🔧 ${currentPath}: null → [] (empty array)`);
        } else if (
          origValue === null &&
          sanValue &&
          typeof sanValue === 'object' &&
          !Array.isArray(sanValue)
        ) {
          changes.push(`🔧 ${currentPath}: null → {} (empty object)`);
        } else if (
          typeof origValue === 'string' &&
          typeof sanValue === 'string' &&
          origValue !== sanValue
        ) {
          changes.push(
            `🔧 ${currentPath}: "${origValue}" → "${sanValue}" (datetime format)`
          );
        } else if (origValue && sanValue && typeof origValue === 'object') {
          findChanges(origValue, sanValue, currentPath);
        }
      }
    }
  }

  findChanges(original, sanitized);
  return changes;
}

export {
  sanitizeFormData,
  sanitizeDatetime,
  shouldBeArray,
  shouldBeObject,
  findSanitizationChanges,
};

export default sanitizeFormData;
