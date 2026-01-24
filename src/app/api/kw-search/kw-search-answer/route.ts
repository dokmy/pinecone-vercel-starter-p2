import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    
    if (!body.path || !body.query) {
      return NextResponse.json(
        { error: "Missing required fields: path and query" },
        { status: 400 }
      );
    }

    const { path, query } = body;

    // Extract case details from path
    // Example paths:
    // /en/cases/hkcfi/2023/123
    // /en/legis/reg/369C/s201
    // /tc/cases/hkdc/2007/145
    console.log("Processing path:", path);

    let apiUrl;
    if (path.includes("/cases/")) {
      const matches = path.match(/\/(en|tc)\/cases\/([^\/]+)\/(\d+)\/(\d+)/);
      if (!matches) {
        console.log("Failed to match case path pattern");
        return NextResponse.json(
          { error: "Invalid case path format" },
          { status: 400 }
        );
      }
      const [, lang, abbr, year, num] = matches;
      apiUrl = `https://hklii.hk/api/getjudgment?lang=${lang}&abbr=${abbr}&year=${year}&num=${num}`;
    } else if (path.includes("/legis/")) {
      const matches = path.match(/\/(en|tc)\/legis\/([^\/]+)\/([^\/]+)(?:\/s(\d+))?/);
      if (!matches) {
        console.log("Failed to match legislation path pattern");
        return NextResponse.json(
          { error: "Invalid legislation path format" },
          { status: 400 }
        );
      }
      const [, lang, type, cap, section] = matches;
      apiUrl = `https://hklii.hk/api/getlegislation?lang=${lang}&type=${type}&cap=${cap}${section ? `&section=${section}` : ''}`;
    } else {
      console.log("Path does not contain /cases/ or /legis/");
      return NextResponse.json(
        { error: "Unsupported document type" },
        { status: 400 }
      );
    }

    console.log("Fetching from API URL:", apiUrl);

    // Fetch content from HKLII API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log("API response not OK:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch content: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.content) {
      console.log("No content in API response");
      return NextResponse.json(
        { error: "No content found in data" },
        { status: 404 }
      );
    }

    // Parse and clean HTML content
    const root = parse(data.content);
    const textContent = root.textContent.trim();

    if (!textContent) {
      return NextResponse.json(
        { error: "No text content found after parsing" },
        { status: 404 }
      );
    }

    // Create completion with streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal assistant analyzing case law. Provide clear and concise responses based on the case content provided.

For case summaries:
- Provide a brief overview of the key points (2-3 sentences)
- Include the main issue and outcome
- Keep summaries under 100 words

For specific queries:
1. If the query is relevant, provide a direct answer supported by brief quotes
2. If the query is not clearly relevant, still try to provide helpful information from the case that might relate to the query
3. If there is absolutely no relevant information, only then respond with "This case does not contain information relevant to this query"

Keep all responses concise and focused on the most important points.`,
        },
        {
          role: "user",
          content: `Analyze this case regarding: "${query}"\n\nCase content:\n${textContent}`,
        }
      ],
      stream: true,
      max_tokens: 2000,
    });

    console.log("Stream created for path:", body.path);

    // Convert the stream to a readable stream
    const readableStream = new ReadableStream({
      async start(controller) {
        console.log("Starting stream processing for path:", body.path);
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              console.log("Received content chunk for path:", body.path, "Content:", JSON.stringify(content));
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          console.log("Stream completed successfully for path:", body.path);
          controller.close();
        } catch (error) {
          console.error("Error in stream processing for path:", body.path, "Error:", error);
          controller.error(error);
        }
      },
    });

    console.log("Preparing response for path:", body.path);
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error: any) {
    console.error('Error in kw-search-answer:', error);
    
    // Handle specific error types
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request was aborted" },
        { status: 499 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 