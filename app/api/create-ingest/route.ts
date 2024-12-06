import CreatePR from '@/utils/CreatePR';
import { NextRequest, NextResponse } from 'next/server'

function isJson(str: string) {
  try {
      JSON.parse(str);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
      return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log('in route is json?', isJson(data))
    console.log('data in route')
    console.log({data})
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