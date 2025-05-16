import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ NEXTAUTH_URL: process.env.NEXTAUTH_URL });
}
