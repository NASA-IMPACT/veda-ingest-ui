import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[Route Handler] GET /api/allowed-tenants called');

  const mockTenantsEnv = process.env.NEXT_PUBLIC_MOCK_TENANTS;
  if (mockTenantsEnv && mockTenantsEnv.trim() !== '') {
    console.log('[Route Handler] Using mock tenants from env:', mockTenantsEnv);
    const tenants = mockTenantsEnv
      .split(',')
      .map((tenant) => tenant.trim())
      .filter(Boolean);
    return NextResponse.json({ tenants });
  }

  try {
    console.log('[Route Handler] Getting session...');
    const session = await auth();
    console.log('[Route Handler] Session:', session ? 'exists' : 'null');
    const accessToken = (session as any)?.accessToken as string | undefined;

    console.log('accessToken:', accessToken ? 'exists' : 'undefined');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log(
      '[Route Handler] Fetching allowed tenants from backend with headers:',
      headers
    );
    const allowedTenants = await fetch(
      'https://dev.openveda.cloud/api/ingest/auth/tenants/writable',
      {
        method: 'GET',
        headers,
      }
    );

    console.log(
      '[Route Handler] allowedTenants response:',
      allowedTenants.status
    );
    if (!allowedTenants.ok) {
      const text = await allowedTenants.text();
      console.log('[Route Handler] allowedTenants error:', text);
      return NextResponse.json(
        {
          error: 'allowedTenants fetch failed',
          status: allowedTenants.status,
          body: text,
        },
        { status: allowedTenants.status }
      );
    }

    const data = await allowedTenants.json();
    console.log('[Route Handler] Returning data:', data);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[Route Handler] Error:', e);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
