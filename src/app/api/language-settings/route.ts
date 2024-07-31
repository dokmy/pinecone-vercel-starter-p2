import { NextResponse } from 'next/server';
import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const { userId, outputLanguage } = await req.json();

    const updatedSettings = await prismadb.settings.upsert({
      where: { userId },
      update: { outputLanguage },
      create: { userId, outputLanguage },
    });

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}