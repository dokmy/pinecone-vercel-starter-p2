import prismadb from "../../lib/prismadb";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { userId } = await req.json();
    const _searches = await prismadb.search.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            searchResults: true,
        },
      });

    return NextResponse.json(_searches);
  };