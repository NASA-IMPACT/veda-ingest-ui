import CreatePR from '@/utils/CreatePR';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const githubResponse = await CreatePR(data);
   
    return NextResponse.json(githubResponse)
  } catch (error) {
    if (error instanceof Error ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }
}