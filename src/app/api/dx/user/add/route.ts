import { NextResponse } from 'next/server';
import prismadb from '../../../../lib/prismadb';

const API_KEY = process.env.DATAXQUAD_API_KEY;

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, userEmail, userName, no_of_credits } = await request.json();

  // Check for missing required fields
  if (!userId || !userEmail || !userName || no_of_credits === undefined) {
    return NextResponse.json({ error: 'Missing userId, userEmail, userName, or no_of_credits' }, { status: 400 });
  }

  try {
    // Check if user exists by userId (unique field)
    const existingUser = await prismadb.userMessageCredit.findUnique({
      where: { userId: userId },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = await prismadb.userMessageCredit.create({
      data: {
        userId: userId,
        userEmail: userEmail,
        userName: userName,
        count: no_of_credits,
      },
    });

    return NextResponse.json({ message: 'User added successfully', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
