type FormLikeData = {
  renders?:
    | string
    | {
        dashboard?: unknown;
      }
    | null;
  [key: string]: unknown;
};

export const CleanAndPrettifyJSON = (data: FormLikeData): string => {
  const cleanedData: FormLikeData = { ...data };

  if (
    typeof cleanedData.renders === 'object' &&
    cleanedData.renders !== null &&
    typeof cleanedData.renders.dashboard === 'string' &&
    cleanedData.renders.dashboard.trim() !== ''
  ) {
    try {
      cleanedData.renders.dashboard = JSON.parse(cleanedData.renders.dashboard);
    } catch {
      console.warn(
        "Invalid JSON in 'renders dashboard' field. Keeping as string."
      );
    }
  }

  return JSON.stringify(cleanedData, null, 2);
};
