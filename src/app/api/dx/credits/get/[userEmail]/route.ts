import { NextResponse } from 'next/server';
import prismadb from '../../../../../lib/prismadb';

const API_KEY = process.env.DATAXQUAD_API_KEY;

// Define the type for params
interface Params {
  userEmail: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userEmail } = params;

  if (!userEmail) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
  }

  try {
    const userMessageCredit = await prismadb.userMessageCredit.findUnique({
      where: { userEmail: userEmail },
    });

    if (!userMessageCredit) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ credits: userMessageCredit.count });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
