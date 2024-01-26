import prismadb from "../../lib/prismadb";
import { NextResponse } from "next/server";

export const POST = async (req:Request) => {
    const {searchId} = await req.json();
    try {
        
        const search = await prismadb.search.findUnique({
            where: {
                id: searchId
            }
        })
        if (search){
            return NextResponse.json(search.resultsShown)
        }
        
    } catch (error) {
        return new NextResponse("Sth went wrong", {status:500})
    }
}
