import prismadb from "../../lib/prismadb";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { searchId, casesShown } = await req.json();
    try {
        
        await prismadb.search.update({
            where: {
                id: searchId,
            },
            data: {
                resultsShown: casesShown
            }
        })

        return new NextResponse("Update Success", { status: 200 })
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }

  };