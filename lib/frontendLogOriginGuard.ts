export type OriginGuardResult =
  | { allowed: true }
  | { allowed: false; status: number; reason: string };

const getPrimaryHeaderValue = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const primary = value
    .split(',')
    .map((part) => part.trim())
    .find((part) => part !== '');

  return primary ?? null;
};

export const validateFrontendLogOrigin = (
  headers: Headers,
  isProduction: boolean
): OriginGuardResult => {
  const originHeader = headers.get('origin');
  const forwardedHost = getPrimaryHeaderValue(headers.get('x-forwarded-host'));
  const host = getPrimaryHeaderValue(headers.get('host'));
  const requestHost = (forwardedHost ?? host)?.toLowerCase() ?? null;

  if (!requestHost) {
    return {
      allowed: false,
      status: 400,
      reason: 'missing_request_host',
    };
  }

  if (!originHeader) {
    if (isProduction) {
      return {
        allowed: false,
        status: 403,
        reason: 'missing_origin_header',
      };
    }

    return { allowed: true };
  }

  let originUrl: URL;
  try {
    originUrl = new URL(originHeader);
  } catch {
    return {
      allowed: false,
      status: 400,
      reason: 'invalid_origin_header',
    };
  }

  if (isProduction && originUrl.protocol !== 'https:') {
    return {
      allowed: false,
      status: 403,
      reason: 'non_https_origin',
    };
  }

  if (originUrl.host.toLowerCase() !== requestHost) {
    return {
      allowed: false,
      status: 403,
      reason: 'origin_host_mismatch',
    };
  }

  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site') {
    return {
      allowed: false,
      status: 403,
      reason: 'cross_site_request_rejected',
    };
  }

  return { allowed: true };
};
