// src/app/api/listing-rules/chat/route.ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { serperSearch, SerperOrganicResult } from '../../../../lib/serper';
import { auth, currentUser } from "@clerk/nextjs";
import prismadb from "../../../lib/prismadb";
import { getMessageCreditCount, deductMessageCredit } from "@/lib/messageCredits";
import fetch from 'node-fetch';
import https from 'https';
import * as cheerio from 'cheerio';

// Create a custom fetch agent that ignores SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const MAX_CONTENT_LENGTH = 300000; // ~75k tokens

function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, and other unnecessary elements
  $('script').remove();
  $('style').remove();
  $('link').remove();
  $('meta').remove();
  $('noscript').remove();
  $('iframe').remove();
  
  // Get text content from body
  const text = $('body').text();
  
  // Clean up whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithSSLHandling(url: string) {
  try {
    const response = await fetch(url, { 
      agent: httpsAgent,
      timeout: 5000
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    
    // Clean and truncate the content
    const cleanedContent = cleanHtml(html);
    if (cleanedContent.length > MAX_CONTENT_LENGTH / 2) { // Split limit between two results
      return cleanedContent.slice(0, MAX_CONTENT_LENGTH / 2);
    }
    return cleanedContent;
  } catch (error) {
    // Only log non-SSL certificate errors
    if (!(error instanceof Error) || !error.message.includes('certificate')) {
      console.error(`Error fetching ${url}:`, error);
    }
    return null;
  }
}

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
  try {
    // Auth and credit check first
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Credit check
    const creditsLeft = await getMessageCreditCount(userId);
    console.log("User has", creditsLeft, "credits remaining");

    if (creditsLeft === false || creditsLeft <= 0) {
      console.log("Search rejected - insufficient credits");
      return new Response(JSON.stringify({ error: "No more credits. Please upgrade or buy more credits." }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
        content: undefined
      }));

    // Fetch full content for top 2 results using SSL-handling fetch
    console.log("📡 Fetching page contents for top 2 results...");
    for (let i = 0; i < Math.min(2, filteredResults.length); i++) {
      try {
        const content = await fetchWithSSLHandling(filteredResults[i].url);
        if (content) {
          filteredResults[i].content = content;
          console.log(`✅ Successfully fetched content for result ${i + 1}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch content for result ${i + 1}:`, error);
      }
    }

    console.log("✅ Found results:", filteredResults);

    // Even if we can't fetch full content, we still return the basic results
    return new Response(JSON.stringify(filteredResults), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: "Failed to perform search" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main chat endpoint
export async function POST(req: Request) {
  try {
    // Auth check
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("Starting listing rules chat for user", userId);

    // Credit check
    const creditsLeft = await getMessageCreditCount(userId);
    console.log("User has", creditsLeft, "credits remaining");

    if (creditsLeft === false || creditsLeft <= 0) {
      console.log("Chat rejected - insufficient credits");
      return new Response(JSON.stringify({ error: "No more credits. Please upgrade or buy more credits." }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user details
    const user = await currentUser();
    const userName = user?.firstName && user?.lastName ? 
      `${user.firstName} ${user.lastName}` : null;
    const userEmail = user?.emailAddresses[0]?.emailAddress || null;

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Generate optimized search query
    console.log("🔍 Generating search query for:", userQuery);
    const searchQuery = await generateSearchQuery(userQuery);
    console.log("✨ Optimized query:", searchQuery);

    // Perform search directly using serperSearch
    console.log("🔎 Searching with optimized query...");
    const searchResults = await serperSearch(searchQuery);
    const filteredResults: SearchResult[] = searchResults.organic
      .filter((result: SerperOrganicResult) => result.link.startsWith('https://en-rules.hkex.com.hk/'))
      .map((result: SerperOrganicResult) => ({
        url: result.link,
        title: result.title,
        snippet: result.snippet
      }));

    // Fetch full content for top 2 results using SSL-handling fetch
    console.log("📡 Fetching page contents for top 2 results...");
    for (let i = 0; i < Math.min(2, filteredResults.length); i++) {
      try {
        const content = await fetchWithSSLHandling(filteredResults[i].url);
        if (content) {
          filteredResults[i].content = content;
          console.log(`✅ Successfully fetched content for result ${i + 1}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch content for result ${i + 1}:`, error);
      }
    }

    // Add debug logging
    console.log('🔍 POST: Search Results:', {
      resultsLength: filteredResults.length,
      rawResults: JSON.stringify(filteredResults, null, 2)
    });

    // Prepare context with search results
    const searchContext = filteredResults.length > 0
      ? `Here are the relevant HKEX listing rules I found:

${filteredResults.map((r: SearchResult, index: number) => 
  index < 2 && r.content
    ? `Source: ${r.title}\nURL: ${r.url}\n\nFull Content:\n${r.content}\n---\n`
    : `Additional Reference:\n- ${r.title}\n  ${r.url}\n  ${r.snippet}\n`
).join('\n')}

Based on these sources (particularly the first two which are most relevant), `
      : "I couldn't find specific HKEX listing rules for this query. However, ";

    console.log('🤖 POST: Sending to OpenAI...');
    console.log('📝 POST: Context length:', searchContext.length);

    // Get previous messages from the conversation
    const previousMessages = messages.slice(0, -1);
    
    // Construct the full message array
    const fullMessages = [
      {
        role: 'system',
        content: `You are a helpful assistant that answers questions about HKEX listing rules. 
        Always reference the sources provided when answering.
        Focus primarily on the full content provided from the first two sources.
        Use additional references as supporting information if needed.
        Keep responses clear, well-structured, and comprehensive.
        When citing specific rules or requirements, quote the exact text from the source content.`
      },
      ...previousMessages,
      {
        role: 'user',
        content: searchContext + userQuery
      }
    ];

    // Log the full messages being sent to OpenAI
    console.log('📤 POST: Full OpenAI messages:', JSON.stringify(fullMessages, null, 2));
    console.log('📊 POST: Message stats:', {
      totalMessages: fullMessages.length,
      systemPromptLength: fullMessages[0].content.length,
      finalPromptLength: fullMessages[fullMessages.length - 1].content.length,
      historyMessages: fullMessages.length - 2 // excluding system and final prompt
    });

    // Create completion with search results as context
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      stream: true,
    });

    // Create stream with completion callback
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        try {
          // Log raw response for debugging
          console.log("🤖 Raw OpenAI response:", completion);
          console.log("\n-------------------\n");

          // Save chat history
          await prismadb.listingRulesChat.create({
            data: {
              userId,
              userName,
              userEmail,
              question: userQuery,
              answer: completion,
              sources: JSON.stringify(filteredResults)
            }
          });
          console.log("✅ Chat history saved");

          // Deduct credit
          await deductMessageCredit(userId);
          console.log("💳 Credit deducted");
        } catch (error) {
          console.error("❌ Failed to save chat history:", error);
          // Continue even if saving fails
        }
      }
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: "Failed to start chat" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}