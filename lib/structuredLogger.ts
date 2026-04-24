import {
  configureSync,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
  type LogLevel as LogTapeLevel,
  type Logger,
} from '@logtape/logtape';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type JsonValue =
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

const MAX_REQUEST_ID_LENGTH = 128;
const DEFAULT_PRODUCTION_LOG_LEVEL: LogLevel = 'warn';
const DEFAULT_DEBUG_LOG_LEVEL: LogLevel = 'debug';

export interface RequestLogContext {
  requestId: string;
  route: string;
  method: string;
  path: string;
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

let isLogTapeConfigured = false;
const isDebugLoggingEnabled = process.env.ENABLE_DEBUG_LOGGING === 'true';

const parseLogLevelFromEnv = (): LogLevel | null => {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();

  if (!raw) {
    return null;
  }

  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }

  if (raw === 'warning') {
    return 'warn';
  }

  return null;
};

const configuredLogLevel: LogLevel = isDebugLoggingEnabled
  ? (parseLogLevelFromEnv() ?? DEFAULT_DEBUG_LOG_LEVEL)
  : DEFAULT_PRODUCTION_LOG_LEVEL;

const ensureLogTapeConfigured = (): void => {
  if (isLogTapeConfigured) {
    return;
  }

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

  isLogTapeConfigured = true;
};

const getBaseLogger = (): Logger => {
  ensureLogTapeConfigured();
  return getLogger(['veda-ingest-ui', 'app']);
};

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

const toSerializableError = (
  error: unknown
): { name: string; message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
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
  };
};

const toLogTapeLevel = (level: LogLevel): LogTapeLevel => {
  if (level === 'warn') {
    return 'warning';
  }

  return level;
};

const shouldLogSuccessfulRequest = (): boolean => isDebugLoggingEnabled;

export const logStructured = (
  level: LogLevel,
  event: string,
  details: Record<string, JsonValue> = {}
): void => {
  const logger = getBaseLogger();
  const payload = {
    event,
    ...details,
  };

  const logTapeLevel = toLogTapeLevel(level);

  switch (logTapeLevel) {
    case 'debug':
      logger.debug('{event}', payload);
      break;
    case 'info':
      logger.info('{event}', payload);
      break;
    case 'warning':
      logger.warn('{event}', payload);
      break;
    case 'error':
      logger.error('{event}', payload);
      break;
    default:
      logger.info('{event}', payload);
      break;
  }
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

export const logRequestStart = (
  context: RequestLogContext,
  details: Record<string, JsonValue> = {}
): void => {
  if (!shouldLogSuccessfulRequest()) {
    return;
  }

  logStructured('info', 'api.request.start', {
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    path: context.path,
    ...details,
  });
};

export const logRequestEnd = (
  context: RequestLogContext,
  status: number,
  details: Record<string, JsonValue> = {}
): void => {
  if (status < 400 && !shouldLogSuccessfulRequest()) {
    return;
  }

  const level: LogLevel =
    status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  logStructured(level, 'api.request.end', {
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    path: context.path,
    status,
    durationMs: Date.now() - context.startTime,
    ...details,
  });
};

export const logRequestError = (
  context: RequestLogContext,
  error: unknown,
  details: Record<string, JsonValue> = {}
): void => {
  logStructured('error', 'api.request.error', {
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    path: context.path,
    durationMs: Date.now() - context.startTime,
    error: toSerializableError(error),
    ...details,
  });
};
