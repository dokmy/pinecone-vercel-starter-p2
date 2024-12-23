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
    // First find all users with this email
    const userMessageCredits = await prismadb.userMessageCredit.findMany({
      where: { userEmail: userEmail },
    });

    if (userMessageCredits.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset credits for each user with this email
    await Promise.all(
      userMessageCredits.map((credit) =>
        prismadb.userMessageCredit.update({
          where: { userId: credit.userId },
          data: { count: 0 },
        })
      )
    );

    return NextResponse.json({ message: 'Credits reset to 0 successfully' });
  } catch (error) {
    console.error('Error resetting credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
