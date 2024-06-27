import { NextResponse } from 'next/server';
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse request body' }, { status: 400 });
  }

  const { userId } = requestBody;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    console.log('Private Metadata:', user.privateMetadata);
    return NextResponse.json(user.privateMetadata);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
