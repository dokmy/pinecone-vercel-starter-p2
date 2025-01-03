// src/app/api/listing-rules/chat/route.ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { serperSearch, SerperOrganicResult } from '../../../../lib/serper';

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  content?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateSearchQuery(userQuery: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a search query optimizer. Convert user questions about HKEX listing rules into focused search queries. Extract key terms and concepts. Do not add unnecessary words. Output only the search query.'
      },
      {
        role: 'user',
        content: userQuery
      }
    ],
    temperature: 0.1,
    max_tokens: 100
  });

  return response.choices[0].message.content || userQuery;
}

// Separate endpoint for search
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  if (!query) {
    return new Response('Query parameter is required', { status: 400 });
  }

  // 1. Generate optimized search query
  console.log("🔍 Generating search query for:", query);
  const searchQuery = await generateSearchQuery(query);
  console.log("✨ Optimized query:", searchQuery);

  // 2. Perform search with optimized query
  console.log("🔎 Searching with optimized query...");
  const searchResults = await serperSearch(searchQuery);
  const filteredResults: SearchResult[] = searchResults.organic
    .filter((result: SerperOrganicResult) => result.link.startsWith('https://en-rules.hkex.com.hk/'))
    .map((result: SerperOrganicResult) => ({
      url: result.link,
      title: result.title,
      snippet: result.snippet,
    }));
  console.log("✅ Found results:", filteredResults);

  return new Response(JSON.stringify(filteredResults), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Main chat endpoint
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content;

  // Get search results first
  const searchResponse = await fetch(`${req.url}?query=${encodeURIComponent(userQuery)}`);
  const searchResults = await searchResponse.json();

  // Prepare context with search results
  const searchContext = searchResults.length > 0
    ? `Here are the relevant HKEX listing rules I found:

${searchResults.map((r: SearchResult, index: number) => 
  index < 2 && r.content
    ? `Source: ${r.title}\nURL: ${r.url}\n\nFull Content:\n${r.content}\n---\n`
    : `Additional Reference:\n- ${r.title}\n  ${r.url}\n  ${r.snippet}\n`
).join('\n')}

Based on these sources (particularly the first two which are most relevant), `
    : "I couldn't find specific HKEX listing rules for this query. However, ";

  // Create completion with search results as context
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that answers questions about HKEX listing rules. 
        Always reference the sources provided when answering.
        Focus primarily on the full content provided from the first two sources.
        Use additional references as supporting information if needed.
        Keep responses clear and concise.
        Format your response in markdown.
        When citing specific rules or requirements, quote the exact text from the source content.`
      },
      ...messages.slice(0, -1),
      {
        role: 'user',
        content: searchContext + userQuery
      }
    ],
    stream: true,
  });

  // Return streaming response
  return new StreamingTextResponse(OpenAIStream(response));
}