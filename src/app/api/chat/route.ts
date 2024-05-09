import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'
import prismadb from '../../lib/prismadb'
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { checkMessageCredits, deductMessageCredit, getMessageCreditCount } from '@/lib/messageCredits';

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)



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

  if (creditsLeft == 0) {
    return new NextResponse("No more credits. Please upgrade or buy more credits." , {status:403})
  }

  if (creditsLeft == false) {
    return new NextResponse("Credits left is null.", {status: 401})
  } 
  

  if (creditsLeft > 0) {
    // await deductMessageCredit(userId)
    console.log("Message is permitted. Deduct 1 credit after completion.")
  }

    const { messages, filter, searchResultId, countryOption } = await req.json()
    const lastMessage = messages[messages.length - 1]

    console.log("here is last message: ", lastMessage)

    const context = await getContext(lastMessage.content, '', filter, countryOption)

    let prompt = [
        {
          role: 'system',
          content: `Here are the context information:
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        You are a AI legal assistant for lawyers in Hong Kong. Please cite relevant legal sources or cases where applicable. Do not make assumptions beyond the provided context. 
        
        Your responses will be rendered using ReactMarkdown, so pleaseuse Markdown syntax for formatting as much as possible to make your responses more readable. If necessary, use bullet points, h1, h2, h3 to structure your responses. Also, use bold and italics to emphasize key points.
        
        Here is the question:
        `,
        },
      ]
    

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-4-0125-preview',
      // model: 'gpt-3.5-turbo-0125',
      stream: true,
      // messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')],
      messages: [...prompt, ...messages]
    })
    


    const stream = OpenAIStream(response, {
      onStart: async () => {
        // save user message into db
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
      onCompletion: async (completion) => {
        // save ai message into db
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
      },
    });
    
    
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}