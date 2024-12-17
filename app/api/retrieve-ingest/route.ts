import RetrieveJSON from '@/utils/RetrieveJSON';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ref = request?.nextUrl?.searchParams.get('ref') || '';
    const response = await RetrieveJSON(ref);
    return NextResponse.json({ ...response });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.log(error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }
}
