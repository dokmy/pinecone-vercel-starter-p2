import { auth } from "@clerk/nextjs";
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log("answer-with-case: Starting request");
    
    const { userId } = auth();
    if (!userId) {
      console.log("answer-with-case: Unauthorized request");
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    console.log("answer-with-case: Received body:", JSON.stringify(body));

    // Extract query from the last message
    const lastMessage = body.messages[body.messages.length - 1];
    const query = lastMessage.content;
    
    // Extract chunks from function call arguments
    const chunks = JSON.parse(lastMessage.function_call?.arguments || '{}').chunks || [];

    console.log("answer-with-case: Received request with query:", query);
    console.log("answer-with-case: Number of chunks:", chunks.length);
    console.log("answer-with-case: Total text length:", chunks.join("\n\n").length);

    if (!query || !chunks || chunks.length === 0) {
      console.log("answer-with-case: Missing required fields");
      return new Response("Missing query or chunks", { status: 400 });
    }

    // Combine chunks with newlines between them
    const combinedText = chunks.join("\n\n");
    console.log("answer-with-case: Combined text length:", combinedText.length);

    const systemPrompt = `You are a legal expert assistant. Your task is to analyze legal cases and provide clear, structured responses.
Your responses will be rendered using React Markdown, so use the following formatting:
- Use standard markdown for headings and lists
- Enclose quotes in triple backticks to render them as distinct blocks
- Use bold for emphasis where appropriate

Format your response like this:

## Summary
(Your concise summary of the case)

## Relevance to Your Situation

### 1. First reason for relevance
\`\`\`
Exact quote from the case
\`\`\`

### 2. Second reason for relevance
\`\`\`
Another exact quote from the case
\`\`\`
(Continue with additional numbered points as needed)`;

    const userPrompt = `Here are the context information:

START CONTEXT BLOCK
${combinedText}
END OF CONTEXT BLOCK

Please analyze this case for me as follows:

1. Summarize the case concisely.
2. Explain why this case is relevant to my situation in point form. For each point:
   - State the reason for relevance
   - Support your point by citing the exact relevant text from the case

Here is my situation/query:
${query}`;

    console.log("answer-with-case: Calling GPT-4...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Convert the response into a friendly stream using Vercel AI SDK
    const stream = OpenAIStream(response);
    
    // Return a StreamingTextResponse, which can be consumed by the useChat hook
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("answer-with-case: Error processing request:", error);
    return new Response("Internal Error", { status: 500 });
  }
} 