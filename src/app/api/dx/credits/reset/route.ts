import { NextResponse } from 'next/server';
import prismadb from '../../../../lib/prismadb';

const API_KEY = process.env.DATAXQUAD_API_KEY;

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userEmail } = await request.json();

  if (!userEmail) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
  }

  try {
    const userMessageCredit = await prismadb.userMessageCredit.findUnique({
      where: { userEmail: userEmail },
    });

    if (userMessageCredit) {
      await prismadb.userMessageCredit.update({
        where: { userEmail: userEmail },
        data: { count: 0 },
      });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Credits reset to 0 successfully' });
  } catch (error) {
    console.error('Error resetting credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
