import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mockTenantsEnv = process.env.NEXT_PUBLIC_MOCK_TENANTS;
  if (mockTenantsEnv && mockTenantsEnv.trim() !== '') {
    console.info(
      '[Route Handler] Using mock tenants from env:',
      mockTenantsEnv
    );
    const tenants = mockTenantsEnv
      .split(',')
      .map((tenant) => tenant.trim())
      .filter(Boolean);
    return NextResponse.json({ tenants });
  }

  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken as string | undefined;

    const headers: Record<string, string> = {
      accept: 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const allowedTenants = await fetch(
      'https://dev.openveda.cloud/api/ingest/auth/tenants/writable',
      {
        method: 'GET',
        headers,
      }
    );

    if (!allowedTenants.ok) {
      const text = await allowedTenants.text();
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
    return NextResponse.json(data);
  } catch (e) {
    console.error('[Route Handler] Error:', e);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
