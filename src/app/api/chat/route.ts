import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages, filter} = await req.json()
    console.log("POSTMAN is summoned. Here are my messages and filter: \n")
    console.log(messages + "\n")
    console.log(filter + "\n")
    

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '', filter)

    let prompt
    if (filter) {
      prompt = [
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
    } else {
      prompt = [
        {
          role: 'system',
          content: ``,
        },
      ]
    }
    

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')]
    })
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}