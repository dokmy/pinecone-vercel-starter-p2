import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import  {getSearchKeywords} from "../../utils/getSearchKeywords"
import { getRelevantCases } from "../../utils/getRelevantCases"
import { buildCaseContext } from "../../utils/buildCaseContext"
import { getRelevantLegis } from "../../utils/getRelevantLegis"
import { buildLegisContext } from "../../utils/buildLegisContext"
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY})

export async function POST(request: Request) {
  const { message, database } = await request.json();

  console.log('\x1b[32m%s\x1b[0m',"[build-context-for-fa.ts] database: " + database)

  let systemPrompt = []
  if (database === "judgement") {
    const searchKeywords = await getSearchKeywords(message, database)
    const relevantCases = await getRelevantCases(searchKeywords)
    systemPrompt = await buildCaseContext(relevantCases)
  }

  if (database === "legislation") {
    const searchKeywords = await getSearchKeywords(message, database)
    const relevantLegis = await getRelevantLegis(searchKeywords)
    systemPrompt = await buildLegisContext(relevantLegis)
  }

  return new NextResponse(JSON.stringify({ systemPrompt }))
}