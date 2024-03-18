import { Configuration, OpenAIApi } from 'openai-edge'
import { AnthropicStream, OpenAIStream, StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { experimental_buildAnthropicPrompt } from 'ai/prompts';
import { first } from 'cheerio/lib/api/traversing';
 
// Create an Anthropic API client (that's edge friendly)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});
 
// // Create an OpenAI API client (that's edge friendly!)
// const config = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// //   apiKey: process.env.GROQ_API_KEY,
// //   basePath: "https://api.groq.com/openai/v1"
// });

// const openai = new OpenAIApi(config)
 
// Set the runtime to edge for best performance
// export const runtime = 'edge';
 
export async function POST(req: Request) {

  const { messages } = await req.json();

  console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] I am called. Calling the LLM API now")

  const firstMessage = messages[0]
  const lastMessage = messages[messages.length - 1]

  // console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] firstMessage: ", firstMessage)
  // console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] lastMessage: ", lastMessage)
  

  // // Ask OpenAI for a streaming chat completion given the prompt
  // const response = await openai.createChatCompletion({
  //   // model: 'gpt-4-0125-preview',
  //   model: 'gpt-3.5-turbo',
  //   stream: true,
  //   messages: [firstMessage, lastMessage],
  //   temperature: 0
  // });

  // // Convert the response into a friendly text-stream
  // const stream = OpenAIStream(response);

  // Ask Claude for a streaming chat completion given the prompt
  const response = await anthropic.messages.create({
    messages: [{role: 'user', content: [
      {
        "type": "text",
        "text": lastMessage.content
      }
    ]}],
    system: firstMessage.content,
    model: 'claude-3-sonnet-20240229',
    stream: true,
    max_tokens: 4096
  });
 
  // Convert the response into a friendly text-stream
  const stream = AnthropicStream(response);

  console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] response: " + response)


  // Respond with the stream
  return new StreamingTextResponse(stream);
}