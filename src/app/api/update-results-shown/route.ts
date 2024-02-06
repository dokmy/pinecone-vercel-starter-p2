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
        console.error(
            "Error during API call:",
            error instanceof Error ? error.message : "An unknown error occurred"
        );
        return new NextResponse("Internal Error", { status: 500 })
    }

  };