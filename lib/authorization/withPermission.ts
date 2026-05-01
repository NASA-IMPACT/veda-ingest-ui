import { auth } from '@/auth';
import {
  deriveCapabilities,
  UserCapabilities,
} from '@/lib/authorization/policy';
import type { Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

type PermissionPredicate = (capabilities: UserCapabilities) => boolean;

type AuthorizedRouteHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext,
  session: Session
) => Promise<NextResponse>;

type PermissionOptions = {
  unauthenticatedMessage?: string;
  forbiddenMessage?: string;
};

const DEFAULT_UNAUTHENTICATED_MESSAGE = 'Authentication required';
const DEFAULT_FORBIDDEN_MESSAGE =
  'You do not have permission to perform this action.';

export function withPermission<TContext = unknown>(
  checkPermission: PermissionPredicate,
  handler: AuthorizedRouteHandler<TContext>,
  options: PermissionOptions = {}
) {
  return async (request: NextRequest, context: TContext) => {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          error:
            options.unauthenticatedMessage ?? DEFAULT_UNAUTHENTICATED_MESSAGE,
        },
        { status: 401 }
      );
    }

    const capabilities = deriveCapabilities(session);
    if (!checkPermission(capabilities)) {
      return NextResponse.json(
        { error: options.forbiddenMessage ?? DEFAULT_FORBIDDEN_MESSAGE },
        { status: 403 }
      );
    }

    return handler(request, context, session);
  };
}
