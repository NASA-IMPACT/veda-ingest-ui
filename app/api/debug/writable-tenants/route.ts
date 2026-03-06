import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { VEDA_BACKEND_URL } from '@/config/env';
import { createHash } from 'crypto';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = (session as any).accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found in session' },
        { status: 401 }
      );
    }

    let decodedTokenPayload: unknown = null;
    try {
      const payload = accessToken.split('.')[1];
      decodedTokenPayload = payload
        ? JSON.parse(Buffer.from(payload, 'base64').toString())
        : null;
    } catch {
      decodedTokenPayload = null;
    }

    const tokenDebug = {
      accessToken,
      preview: `${accessToken.slice(0, 20)}...${accessToken.slice(-20)}`,
      length: accessToken.length,
      sha256: createHash('sha256').update(accessToken).digest('hex'),
      decodedPayload: decodedTokenPayload,
    };

    const writableTenantsUrl = `${VEDA_BACKEND_URL}/ingest/auth/tenants/writable`;
    const writableResponse = await fetch(writableTenantsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const responseText = await writableResponse.text();

    let parsedBody: unknown = null;
    try {
      parsedBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsedBody = null;
    }

    return NextResponse.json({
      requestUrl: writableTenantsUrl,
      tokenDebug,
      status: writableResponse.status,
      ok: writableResponse.ok,
      contentType: writableResponse.headers.get('content-type'),
      redirected: writableResponse.redirected,
      responseUrl: writableResponse.url,
      parsedBody,
      bodyPreview: responseText.slice(0, 1000),
    });
  } catch (error) {
    console.error('Error in /api/debug/writable-tenants:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Unexpected error while debugging writable tenants endpoint' },
      { status: 500 }
    );
  }
}
