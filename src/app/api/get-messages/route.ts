import prismadb from "../../../lib/prismadb";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { searchResultId } = await req.json();
    const _messages = await prismadb.message.findMany({
        where: {
          searchResultId: searchResultId,
        },
      });

    return NextResponse.json(_messages);
  };