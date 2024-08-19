import prismadb from "../../lib/prismadb";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { searchResultId } = await req.json();

    try {
        // Fetch the SearchResult
        const searchResult = await prismadb.searchResult.findUnique({
            where: {
                id: searchResultId,
            },
        });

        if (!searchResult) {
            return NextResponse.json({ error: "Search result not found" }, { status: 404 });
        }

        // Fetch the messages
        const messages = await prismadb.message.findMany({
            where: {
                searchResultId: searchResultId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json({ searchResult, messages });
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
    }
};