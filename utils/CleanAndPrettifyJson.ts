type FormLikeData = {
  renders?: string | Record<string, unknown> | null;
  [key: string]: unknown;
};

export const CleanAndPrettifyJSON = (data: FormLikeData): string => {
  const cleanedData: FormLikeData = { ...data };

  if (typeof cleanedData.renders === 'object' && cleanedData.renders !== null) {
    Object.entries(cleanedData.renders).forEach(([renderKey, renderValue]) => {
      if (typeof renderValue === 'string' && renderValue.trim() !== '') {
        try {
          cleanedData.renders![renderKey] = JSON.parse(renderValue);
        } catch {
          console.warn(
            `Invalid JSON in 'renders ${renderKey}' field. Keeping as string.`
          );
        }
      }
    });
  }

  return JSON.stringify(cleanedData, null, 2);
};
