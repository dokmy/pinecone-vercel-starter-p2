import { getContext } from '@/utils/context'
import prismadb from '../../lib/prismadb'
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { checkMessageCredits, deductMessageCredit, getMessageCreditCount } from '@/lib/messageCredits';
import { streamText, StreamingTextResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

const fireworks = createOpenAI({
  apiKey: process.env.FIREWORKS_API_KEY ?? '',
  baseURL: 'https://api.fireworks.ai/inference/v1',
});

export async function POST(req: Request) {
  try {

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

  if (creditsLeft ==0 || creditsLeft == false || creditsLeft < 0) {
    return new NextResponse("No more credits. Please upgrade or buy more credits.", {status: 403})
  }

  if (creditsLeft > 0) {
    // await deductMessageCredit(userId)
    console.log("Message is permitted. Deduct 1 credit after completion.")
  }

    const { messages, filter, searchResultId, countryOption } = await req.json()

    const lastMessage = messages[messages.length - 1]

    const context = await getContext(lastMessage.content, '', filter, countryOption)

    let initialPrompt = [
        {
          role: 'user',
          content: `Here are the context information:
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        You are a AI legal assistant for lawyers in Hong Kong. Please cite relevant legal sources or cases where applicable. Do not make assumptions beyond the provided context. 
        
        Your responses will be rendered using ReactMarkdown, so please use Markdown syntax for formatting as much as possible to make your responses more readable. If necessary, use bullet points, h1, h2, h3 to structure your responses. Also, use bold and italics to emphasize key points.
        
        Here is the question. 
        `,
        },
      ]


    const model = fireworks('accounts/fireworks/models/llama-v3-70b-instruct');

    // new AI SDK
    const result = await streamText({
      // model: openai('gpt-4-0125-preview'),
      model: model,
      system: initialPrompt[0].content,
      messages: messages,
      maxTokens: 1000
    })

    const stream = result.toAIStream({
      async onStart()  {
        await prismadb.message.create({
          data:{
            role: Role.user,
            content: lastMessage.content,
            userId: user.id,
            searchResultId: searchResultId,
            userName: userName,
            userEmail: userEmail
          }
        });
      },
      async onCompletion(completion: string) {
        // console.log("Chat API - completion: ", completion)
        await prismadb.message.create({
          data:{
            role: Role.assistant,
            content: completion,
            userId: user.id,
            searchResultId: searchResultId,
            userName: userName,
            userEmail: userEmail
          }
        });
        await deductMessageCredit(userId)
      }
    })

    return new StreamingTextResponse(stream)

  } catch (e) {
    throw (e)
  }
}