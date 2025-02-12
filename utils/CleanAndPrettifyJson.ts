export const CleanAndPrettifyJSON = (data: any): string => {
  const cleanedData = { ...data };

  if (
    typeof cleanedData.renders === 'object' &&
    typeof cleanedData.renders.dashboard === 'string' &&
    cleanedData.renders.dashboard.trim() !== ''
  ) {
    try {
      cleanedData.renders.dashboard = JSON.parse(cleanedData.renders.dashboard);
    } catch (error) {
      console.warn(
        "Invalid JSON in 'renders dashboard' field. Keeping as string."
      );
    }
  }

  return JSON.stringify(cleanedData, null, 2);
};
