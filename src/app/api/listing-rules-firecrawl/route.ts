import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { auth } from "@clerk/nextjs";

const MAX_CONTENT_LENGTH = 300000; // ~75k tokens

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchPageContent(url: string): Promise<string> {
  console.log(`🔍 Firecrawl: Fetching content for URL: ${url}`);
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fc-9a66ca4f3e42497aa20bc6aeeea06505',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"],
        excludeTags: ["nav", "header", "footer", "script", "style"],
        onlyMainContent: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Firecrawl API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Firecrawl API request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.data.markdown;
    
    // Truncate content if it exceeds the limit
    if (content.length > MAX_CONTENT_LENGTH / 2) { // Split limit between two results
      console.log(`📏 Firecrawl: Content length (${content.length}) exceeds limit. Truncating...`);
      content = content.slice(0, MAX_CONTENT_LENGTH / 2);
    }
    
    console.log(`✅ Firecrawl: Successfully fetched content. Length: ${content.length} chars`);
    console.log(`📝 Firecrawl: Content preview: ${content.substring(0, 200)}...`);
    return content;
  } catch (error) {
    console.error(`❌ Firecrawl error for ${url}:`, error);
    return '';
  }
}

export async function GET(req: Request) {
  console.log('🚀 GET: Starting request...');
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    console.log(`🔍 GET: Received search query: "${query}"`);

    if (!query) {
      console.error('❌ GET: Missing query parameter');
      return new Response("Missing query parameter", { status: 400 });
    }

    console.log('🔎 GET: Fetching search results from Serper...');
    const searchResponse = await fetch(
      `https://google.serper.dev/search`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: `site:en-rules.hkex.com.hk ${query}`,
          num: 10
        })
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ GET: Serper API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      throw new Error(`Serper API request failed: ${errorText}`);
    }

    const results = await searchResponse.json();
    console.log(`✅ GET: Received ${results.organic?.length || 0} search results`);
    const organicResults = results.organic || [];

    // Filter out PDFs and non-HKEX results
    const filteredResults = organicResults
      .filter((result: any) => !result.link.endsWith('.pdf'))
      .filter((result: any) => result.link.includes('en-rules.hkex.com.hk'))
      .slice(0, 5);
    
    console.log(`📋 GET: Filtered to ${filteredResults.length} results`);
    console.log('📍 GET: First two URLs to fetch:');
    filteredResults.slice(0, 2).forEach((r: any, i: number) => console.log(`   ${i + 1}. ${r.link}`));

    // Get content for first 2 results
    console.log('📥 GET: Fetching content for top 2 results...');
    const contentPromises = filteredResults.slice(0, 2).map(async (result: any) => {
      const content = await fetchPageContent(result.link);
      result.content = content;
      return result;
    });

    await Promise.all(contentPromises);
    console.log('✅ GET: Content fetching complete');

    return new Response(JSON.stringify(filteredResults), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ GET: Search error:', error);
    return new Response(JSON.stringify({ error: error.message || "Failed to search listing rules" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req: Request) {
  console.log('🚀 POST: Starting chat request...');
  const { userId } = auth();
  if (!userId) {
    console.error('❌ POST: Unauthorized request');
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];
  console.log(`📝 POST: Processing user message: "${lastMessage.content}"`);

  try {
    console.log('🔎 POST: Fetching search results...');
    const searchResponse = await fetch(
      `https://google.serper.dev/search`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: `site:en-rules.hkex.com.hk ${lastMessage.content}`,
          num: 10
        })
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ POST: Serper API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      throw new Error(`Serper API request failed: ${errorText}`);
    }

    const results = await searchResponse.json();
    console.log(`✅ POST: Received ${results.organic?.length || 0} search results`);
    const organicResults = results.organic || [];

    // Filter out PDFs and non-HKEX results
    const filteredResults = organicResults
      .filter((result: any) => !result.link.endsWith('.pdf'))
      .filter((result: any) => result.link.includes('en-rules.hkex.com.hk'))
      .slice(0, 5);

    console.log(`📋 POST: Filtered to ${filteredResults.length} results`);
    console.log('📍 POST: First two URLs to fetch:');
    filteredResults.slice(0, 2).forEach((r: any, i: number) => console.log(`   ${i + 1}. ${r.link}`));

    // Get content for first 2 results
    console.log('📥 POST: Fetching content for top 2 results...');
    const contentPromises = filteredResults.slice(0, 2).map(async (result: any) => {
      const content = await fetchPageContent(result.link);
      result.content = content;
      return result;
    });

    await Promise.all(contentPromises);
    console.log('✅ POST: Content fetching complete');

    // Prepare context from search results
    const searchContext = filteredResults
      .map((result: any, index: number) => {
        return `${index + 1}. ${result.title}\nURL: ${result.link}\n${
          result.content ? `\nContent: ${result.content}\n` : ""
        }${result.snippet}\n`;
      })
      .join("\n");

    console.log('🤖 POST: Sending to OpenAI...');
    console.log('📝 POST: Context length:', searchContext.length);
    
    // Get previous messages from the conversation
    const previousMessages = messages.slice(0, -1);
    
    // Construct the full message array
    const fullMessages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers questions about HKEX listing rules. Use the search results provided to answer questions accurately. If you're not sure about something, say so. Always cite the source URLs when providing information.",
      },
      ...previousMessages,
      {
        role: "user",
        content: `Question: ${lastMessage.content}\n\nSearch Results:\n${searchContext}`,
      },
    ];

    // Log the full messages being sent to OpenAI
    console.log('📤 POST: Full OpenAI messages:', JSON.stringify(fullMessages, null, 2));
    console.log('📊 POST: Message stats:', {
      totalMessages: fullMessages.length,
      systemPromptLength: fullMessages[0].content.length,
      finalPromptLength: fullMessages[fullMessages.length - 1].content.length,
      historyMessages: fullMessages.length - 2 // excluding system and final prompt
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: fullMessages,
      stream: true,
    });

    console.log('✅ POST: OpenAI response received, streaming...');
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error("❌ POST: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process request" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 