import {
  configureSync,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
  type LogLevel as LogTapeLevel,
  type Logger,
} from '@logtape/logtape';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const REQUEST_ID_HEADERS = [
  'x-request-id',
  'x-correlation-id',
  'x-amzn-trace-id',
];

const FRONTEND_LOG_INGEST_PATH = '/api/frontend-logs';
const DEFAULT_ENABLE_FRONTEND_LOG_FORWARDING = true;

const MAX_REQUEST_ID_LENGTH = 128;
const DEFAULT_PRODUCTION_LOG_LEVEL: LogLevel = 'warn';
const DEFAULT_DEBUG_LOG_LEVEL: LogLevel = 'debug';

interface RequestLogBasePayload {
  requestId: string;
  route: string;
  method: string;
  path: string;
}

interface RequestStartPayload extends RequestLogBasePayload {
  [key: string]: JsonValue;
}

interface RequestEndPayload extends RequestLogBasePayload {
  status: number;
  durationMs: number;
  [key: string]: JsonValue;
}

interface RequestErrorPayload extends RequestLogBasePayload {
  durationMs: number;
  error: SerializableError;
  [key: string]: JsonValue;
}

export interface SerializableError {
  [key: string]: JsonValue;
  name: string;
  message: string;
  stack: string | null;
}

export interface FrontendLogEntry {
  level: LogLevel;
  event: string;
  details: Record<string, JsonValue>;
  clientTimestamp: string;
}

export interface RequestLogContext extends RequestLogBasePayload {
  startTime: number;
}

interface HeaderLike {
  get: (name: string) => string | null;
}

interface RequestLike {
  headers?: HeaderLike;
  method?: string;
  nextUrl?: {
    pathname?: string;
  };
  url?: string;
}

const isBrowserRuntime = typeof window !== 'undefined';
const isServerDebugLoggingEnabled = process.env.ENABLE_DEBUG_LOGGING === 'true';
const isFrontendDebugLoggingEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGGING === 'true';

const LOG_LEVEL_ALIASES: Record<string, LogLevel> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  warning: 'warn',
  error: 'error',
};

const parseLogLevelFromEnv = (): LogLevel | null => {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();

  if (!raw) {
    return null;
  }

  return LOG_LEVEL_ALIASES[raw] ?? null;
};

const configuredLogLevel: LogLevel = isBrowserRuntime
  ? isFrontendDebugLoggingEnabled
    ? DEFAULT_DEBUG_LOG_LEVEL
    : DEFAULT_PRODUCTION_LOG_LEVEL
  : isServerDebugLoggingEnabled
    ? (parseLogLevelFromEnv() ?? DEFAULT_DEBUG_LOG_LEVEL)
    : DEFAULT_PRODUCTION_LOG_LEVEL;

const toLogTapeLevel = (level: LogLevel): LogTapeLevel => {
  if (level === 'warn') {
    return 'warning';
  }

  return level;
};

configureSync({
  sinks: {
    console: getConsoleSink({
      formatter: getJsonLinesFormatter({
        categorySeparator: '.',
        properties: 'flatten',
      }),
    }),
  },
  loggers: [
    // application logging policy
    {
      category: 'veda-ingest-ui',
      lowestLevel: toLogTapeLevel(configuredLogLevel),
      sinks: ['console'],
    },
    // logtape library self-logging policy, with stricter filtering
    {
      category: ['logtape', 'meta'],
      lowestLevel: 'warning',
      sinks: ['console'],
    },
  ],
});

const baseLogger: Logger = getLogger(['veda-ingest-ui', 'app']);

const getPathFromRequest = (request: RequestLike, fallback: string): string => {
  if (request.nextUrl?.pathname) {
    return request.nextUrl.pathname;
  }

  if (request.url) {
    try {
      return new URL(request.url).pathname;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const createFallbackRequestId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeRequestId = (value: string): string | null => {
  const normalized = value
    .trim()
    // Remove control characters that can break one-line JSON logs.
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Keep a conservative set of safe characters for IDs.
    .replace(/[^a-zA-Z0-9._:/-]/g, '')
    .slice(0, MAX_REQUEST_ID_LENGTH);

  return normalized === '' ? null : normalized;
};

const pickRequestId = (headers?: HeaderLike): string => {
  if (!headers) {
    return createFallbackRequestId();
  }

  for (const headerName of REQUEST_ID_HEADERS) {
    const value = headers.get(headerName);
    if (value && value.trim() !== '') {
      const sanitized = sanitizeRequestId(value);
      if (sanitized) {
        return sanitized;
      }
    }
  }

  return createFallbackRequestId();
};

export const toSerializableError = (error: unknown): SerializableError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: 'UnknownError',
    message:
      typeof error === 'string'
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return '[unserializable-error]';
            }
          })(),
    stack: null,
  };
};

const getBrowserContext = (): Record<string, JsonValue> => {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    pathname: window.location.pathname,
    href: window.location.href,
  };
};

const shouldForwardFrontendLogs = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  const configuredValue = process.env.NEXT_PUBLIC_FORWARD_FRONTEND_LOGS;
  if (!configuredValue || configuredValue.trim() === '') {
    return DEFAULT_ENABLE_FRONTEND_LOG_FORWARDING;
  }

  return configuredValue.trim().toLowerCase() === 'true';
};

const forwardFrontendLog = (entry: FrontendLogEntry): void => {
  if (!shouldForwardFrontendLogs()) {
    return;
  }

  void fetch(FRONTEND_LOG_INGEST_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify({ logs: [entry] }),
  }).catch(() => {
    // Avoid recursive logging loops if log forwarding itself fails.
  });
};

export const logStructured = (
  level: LogLevel,
  event: string,
  details: Record<string, JsonValue> = {}
): void => {
  const payload = {
    event,
    ...details,
  };

  const logTapeLevel = toLogTapeLevel(level);

  switch (logTapeLevel) {
    case 'debug':
      baseLogger.debug('{event}', payload);
      break;
    case 'info':
      baseLogger.info('{event}', payload);
      break;
    case 'warning':
      baseLogger.warn('{event}', payload);
      break;
    case 'error':
      baseLogger.error('{event}', payload);
      break;
    default:
      baseLogger.info('{event}', payload);
      break;
  }
};

export const logFrontend = (
  level: LogLevel,
  event: string,
  details: Record<string, JsonValue> = {}
): void => {
  const frontendEventName = `frontend.${event}`;
  const payload = {
    runtime: 'browser',
    ...getBrowserContext(),
    ...details,
  };

  logStructured(level, frontendEventName, payload);
  forwardFrontendLog({
    level,
    event: frontendEventName,
    details: payload,
    clientTimestamp: new Date().toISOString(),
  });
};

export const logFrontendError = (
  event: string,
  error: unknown,
  details: Record<string, JsonValue> = {}
): void => {
  logFrontend('error', event, {
    ...details,
    error: toSerializableError(error),
  });
};

export const createRequestLogContext = (
  request: RequestLike,
  route: string
): RequestLogContext => {
  return {
    requestId: pickRequestId(request.headers),
    route,
    method: request.method ?? 'UNKNOWN',
    path: getPathFromRequest(request, route),
    startTime: Date.now(),
  };
};

export const summarizeSession = (
  session: unknown
): Record<string, JsonValue> => {
  if (!session || typeof session !== 'object') {
    return { hasSession: false };
  }

  const sessionRecord = session as {
    scopes?: unknown;
    tenants?: unknown;
    accessToken?: unknown;
    error?: unknown;
  };

  return {
    hasSession: true,
    scopeCount: Array.isArray(sessionRecord.scopes)
      ? sessionRecord.scopes.length
      : 0,
    tenantCount: Array.isArray(sessionRecord.tenants)
      ? sessionRecord.tenants.length
      : 0,
    hasAccessToken: typeof sessionRecord.accessToken === 'string',
    authError:
      typeof sessionRecord.error === 'string' ? sessionRecord.error : null,
  };
};

const contextToBasePayload = (
  context: RequestLogContext
): RequestLogBasePayload => ({
  requestId: context.requestId,
  route: context.route,
  method: context.method,
  path: context.path,
});

export const logRequestStart = (
  context: RequestLogContext,
  details: Record<string, JsonValue> = {}
): void => {
  if (!isServerDebugLoggingEnabled) {
    return;
  }

  const payload: RequestStartPayload = {
    ...contextToBasePayload(context),
    ...details,
  };
  logStructured('info', 'api.request.start', payload);
};

export const logRequestEnd = (
  context: RequestLogContext,
  status: number,
  details: Record<string, JsonValue> = {}
): void => {
  if (status < 400 && !isServerDebugLoggingEnabled) {
    return;
  }

  const level: LogLevel =
    status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  const payload: RequestEndPayload = {
    ...contextToBasePayload(context),
    status,
    durationMs: Date.now() - context.startTime,
    ...details,
  };
  logStructured(level, 'api.request.end', payload);
};

export const logRequestError = (
  context: RequestLogContext,
  error: unknown,
  details: Record<string, JsonValue> = {}
): void => {
  const payload: RequestErrorPayload = {
    ...contextToBasePayload(context),
    durationMs: Date.now() - context.startTime,
    error: toSerializableError(error),
    ...details,
  };
  logStructured('error', 'api.request.error', payload);
};
