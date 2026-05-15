'use client';

import { useEffect } from 'react';
import { logFrontendError } from '@/lib/structuredLogger';

export function FrontendErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logFrontendError(
        'window.error',
        event.error ?? event.message ?? 'Unknown window error',
        {
          source: event.filename,
          line: event.lineno,
          column: event.colno,
        }
      );
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logFrontendError('window.unhandled_rejection', event.reason, {
        source: 'promise',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
