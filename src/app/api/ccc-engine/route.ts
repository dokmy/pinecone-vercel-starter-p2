import { Configuration, OpenAIApi } from 'openai-edge'
import { AnthropicStream, OpenAIStream, StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { auth, currentUser } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { Role } from '@prisma/client';
import { checkMessageCredits, deductMessageCredit, getMessageCreditCount } from '@/lib/messageCredits';


// Create an Anthropic API client (that's edge friendly)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});
 
// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
//   apiKey: process.env.GROQ_API_KEY,
//   basePath: "https://api.groq.com/openai/v1"
});

const openai = new OpenAIApi(config)
 
// Set the runtime to edge for best performance
// export const runtime = 'edge';
 
export async function POST(req: Request) {

  const {userId} = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", {status: 401})
    }

  const user = await currentUser();
    if (!user || !user.id ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

  const userName = user?.firstName + " " + user?.lastName;
  const userEmail = user?.emailAddresses[0].emailAddress;


  // Check if the user has credits record in the database
  const inMessageCreditsDb = await checkMessageCredits(userId);

  if (!inMessageCreditsDb) {
    return new NextResponse("Not inside credits database", {status: 401})
  } 

  const creditsLeft = await getMessageCreditCount(userId)

  if (creditsLeft == 0) {
    return new NextResponse("No more credits. Please upgrade or buy more credits." , {status:403})
  }

  if (creditsLeft == false) {
    return new NextResponse("Credits left is null.", {status: 401})
  } 
  

  if (creditsLeft > 0) {
    await deductMessageCredit(userId)
    console.log("Message is permitted. Deduct 1 credit.")
  }
    

  const { messages } = await req.json();

  console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] I am called. Calling the LLM API now")

  const firstMessage = messages[0]
  const lastMessage = messages[messages.length - 1]

  const response = await openai.createChatCompletion({
        model: 'gpt-4-0125-preview',
        stream: true,
        messages: [firstMessage, lastMessage],
        temperature: 0,
      });
  
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    onStart: async () => {
      // save user message into db
      await prismadb.fastAskMessage.create({
        data:{
          role: Role.user,
          content: lastMessage.content,
          userId: user.id,
          userName: userName,
          userEmail: userEmail
        }
        
      });
    },
    onCompletion: async (completion) => {
      // save ai message into db
      await prismadb.fastAskMessage.create({
        data:{
          role: Role.assistant,
          content: completion,
          userId: user.id,
          userName: userName,
          userEmail: userEmail
        }
        
      });
    }
  });

  // Respond with the stream
  return new StreamingTextResponse(stream);

  // Ask Claude for a streaming chat completion given the prompt
    // const response = await anthropic.messages.create({
    //   messages: [{role: 'user', content: [
    //     {
    //       "type": "text",
    //       "text": lastMessage.content
    //     }
    //   ]}],
    //   system: firstMessage.content,
    //   model: 'claude-3-sonnet-20240229',
    //   stream: true,
    //   max_tokens: 4096
    // });
  
    // // Convert the response into a friendly text-stream
    // const stream = AnthropicStream(response);
    // // Respond with the stream
    // return new StreamingTextResponse(stream);

  // if (firstMessage.content.includes('START OF CONTEXT BLOCK OF RELEVANT LAWS')) {
  //   console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] It's LEGISLATION so I'm running OPENAI.")
  //     // Ask OpenAI for a streaming chat completion given the prompt
  //   const response = await openai.createChatCompletion({
  //     model: 'gpt-4-0125-preview',
  //     stream: true,
  //     messages: [firstMessage, lastMessage],
  //     temperature: 0,
  //   });

  //   // Convert the response into a friendly text-stream
  //   const stream = OpenAIStream(response);
  //   // Respond with the stream
  //   return new StreamingTextResponse(stream);
  // } else {
  //   console.log('\x1b[31m%s\x1b[0m', "[ccc-engine.ts] It's not LEGISLATION so I'm running ANTHROPIC.")
  //   // Ask Claude for a streaming chat completion given the prompt
  //   const response = await anthropic.messages.create({
  //     messages: [{role: 'user', content: [
  //       {
  //         "type": "text",
  //         "text": lastMessage.content
  //       }
  //     ]}],
  //     system: firstMessage.content,
  //     model: 'claude-3-sonnet-20240229',
  //     stream: true,
  //     max_tokens: 4096
  //   });
  
  //   // Convert the response into a friendly text-stream
  //   const stream = AnthropicStream(response);
  //   // Respond with the stream
  //   return new StreamingTextResponse(stream);
  // }
  
}