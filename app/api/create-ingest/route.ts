import CreatePR from '@/utils/CreatePR';
import UpdatePR from '@/utils/UpdatePR';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const githubResponse = await CreatePR(data);

    return NextResponse.json({ githubURL: githubResponse });
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

export async function PUT(request: NextRequest) {
  try {

    const { ref, fileSha, filePath, formData } = await request.json();

    await UpdatePR(ref, fileSha, filePath, formData)

   return NextResponse.json({ message: 'Data updated successfully' }, { status: 200 });
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
