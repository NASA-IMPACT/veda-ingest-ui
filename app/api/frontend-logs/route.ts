import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  createRequestLogContext,
  type FrontendLogEntry,
  type JsonValue,
  logRequestEnd,
  logRequestError,
  logRequestStart,
  logStructured,
  summarizeSession,
} from '@/lib/structuredLogger';
import { validateFrontendLogOrigin } from '@/lib/frontendLogOriginGuard';

const MAX_LOGS_PER_REQUEST = 20;
const MAX_CONTENT_LENGTH_BYTES = 100_000;
const ALLOWED_LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  if (isRecord(value)) {
    return Object.values(value).every((item) => isJsonValue(item));
  }

  return false;
};

const isValidFrontendLogEntry = (value: unknown): value is FrontendLogEntry => {
  if (!isRecord(value)) {
    return false;
  }

  const { level, event, details, clientTimestamp } = value;

  if (typeof level !== 'string' || !ALLOWED_LOG_LEVELS.has(level)) {
    return false;
  }

  if (typeof event !== 'string' || event.trim() === '') {
    return false;
  }

  if (!isRecord(details)) {
    return false;
  }

  if (!Object.values(details).every((item) => isJsonValue(item))) {
    return false;
  }

  if (typeof clientTimestamp !== 'string' || clientTimestamp.trim() === '') {
    return false;
  }

  return true;
};

export async function POST(request: NextRequest) {
  const logContext = createRequestLogContext(request, '/api/frontend-logs');
  logRequestStart(logContext, { target: 'frontend-log-ingest' });

  try {
    const originGuard = validateFrontendLogOrigin(
      request.headers,
      process.env.NODE_ENV === 'production'
    );
    if (!originGuard.allowed) {
      logRequestEnd(logContext, originGuard.status, {
        reason: originGuard.reason,
      });
      return NextResponse.json(
        { error: 'Origin validation failed' },
        { status: originGuard.status }
      );
    }

    const contentLengthRaw = request.headers.get('content-length');
    const contentLength = contentLengthRaw ? Number(contentLengthRaw) : 0;

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_CONTENT_LENGTH_BYTES
    ) {
      logRequestEnd(logContext, 413, {
        reason: 'payload_too_large',
        contentLength,
      });
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await request.json();
    if (!isRecord(body) || !Array.isArray(body.logs)) {
      logRequestEnd(logContext, 400, {
        reason: 'invalid_request_body',
      });
      return NextResponse.json(
        { error: 'Request body must include a logs array' },
        { status: 400 }
      );
    }

    if (body.logs.length === 0 || body.logs.length > MAX_LOGS_PER_REQUEST) {
      logRequestEnd(logContext, 400, {
        reason: 'invalid_log_count',
        logCount: body.logs.length,
      });
      return NextResponse.json(
        {
          error: `Logs array must contain between 1 and ${MAX_LOGS_PER_REQUEST} entries`,
        },
        { status: 400 }
      );
    }

    const validLogs = body.logs.filter((entry): entry is FrontendLogEntry =>
      isValidFrontendLogEntry(entry)
    );

    if (validLogs.length === 0) {
      logRequestEnd(logContext, 400, {
        reason: 'no_valid_logs',
      });
      return NextResponse.json(
        { error: 'No valid log entries found' },
        { status: 400 }
      );
    }

    const session = await auth();
    const droppedCount = body.logs.length - validLogs.length;

    for (const frontendLog of validLogs) {
      logStructured(frontendLog.level, frontendLog.event, {
        ...frontendLog.details,
        source: 'frontend',
        clientTimestamp: frontendLog.clientTimestamp,
        ...(session ? summarizeSession(session) : { hasSession: false }),
      });
    }

    logRequestEnd(logContext, 202, {
      ingestedCount: validLogs.length,
      droppedCount,
    });

    return NextResponse.json(
      {
        accepted: true,
        ingestedCount: validLogs.length,
        droppedCount,
      },
      { status: 202 }
    );
  } catch (error) {
    logRequestError(logContext, error, {
      reason: 'frontend_log_ingest_failed',
      status: 500,
    });
    return NextResponse.json(
      { error: 'Unable to ingest frontend logs' },
      { status: 500 }
    );
  }
}
