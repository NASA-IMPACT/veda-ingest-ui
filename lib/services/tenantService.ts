export const fetchTenantsFromApi = async (): Promise<string[]> => {
  const response = await fetch('/api/tenants');

  if (!response.ok) {
    throw new Error(`Failed to fetch tenants: ${response.statusText}`);
  }

  const data: string[] = await response.json();
  return data;
};
