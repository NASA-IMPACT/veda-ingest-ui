export const CleanAndPrettifyJSON = (data: any): string => {
  const cleanedData = { ...data };

  if (
    typeof cleanedData.renders === 'string' &&
    cleanedData.renders.trim() !== ''
  ) {
    try {
      cleanedData.renders = JSON.parse(cleanedData.renders); // Convert valid JSON string to object
    } catch (error) {
      console.warn("Invalid JSON in 'renders' field. Keeping as string.");
    }
  }

  return JSON.stringify(cleanedData, null, 2);
};
