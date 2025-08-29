import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const tenants = ['tenant1', 'tenant2', 'tenant3', 'tenant4', 'tenant5'];

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Failed to get tenants:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
