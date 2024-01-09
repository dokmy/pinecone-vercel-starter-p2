import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'
import prismadb from '../../../lib/prismadb'
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)


export async function POST(req: Request) {
  try {

    const user = await currentUser();
    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages, filter, searchResultId } = await req.json()
    const lastMessage = messages[messages.length - 1]

    console.log("here is last message: ", lastMessage)

    const context = await getContext(lastMessage.content, '', filter)

    let prompt = [
        {
          role: 'system',
          content: `Here are the context information:
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        You are a AI legal assistant for lawyers in Hong Kong. Answer the follwing question entirely based on the context given. Do not make things up. Here is the question:
        `,
        },
      ]
    

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')]
    })
    


    const stream = OpenAIStream(response, {
      onStart: async () => {
        // save user message into db
        await prismadb.message.create({
          data:{
            role: Role.user,
            content: lastMessage.content,
            userId: user.id,
            searchResultId: searchResultId
          }
          
        });
      },
      onCompletion: async (completion) => {
        // save ai message into db
        await prismadb.message.create({
          data:{
            role: Role.assistant,
            content: completion,
            userId: user.id,
            searchResultId: searchResultId
          }
          
        });
      },
    });
    
    
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}