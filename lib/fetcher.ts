type FetcherResponse<T> =
  | { data: T; error: false }
  | { data: string; error: true };

const fetcher = async <T>(
  url: string,
  requestOptions: RequestInit
): Promise<FetcherResponse<T>> => {
  const res = await fetch(url, requestOptions);
  if (!res.ok) {
    const errorMessage = await res.text();
    return { data: errorMessage, error: true };
  }
  return { error: false, data: (await res.json()) as T };
};

export default fetcher;
