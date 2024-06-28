import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  const encryptedUserId = CryptoJS.AES.encrypt(userId, ENCRYPTION_KEY).toString();
  const encodedUserId = encodeURIComponent(encryptedUserId);

  console.log("ENCRYPTION_KEY: " + ENCRYPTION_KEY)

  return NextResponse.json({ encryptedUserId: encodedUserId });
}
