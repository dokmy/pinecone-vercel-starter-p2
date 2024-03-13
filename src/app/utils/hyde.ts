
import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge';

export async function getHypotheticalAnswer(input: string) {
    console.log("[Hyde.ts - getHypotheticalAnswer] - Here is my input: " + input)
  try {
    const response = await openai.createChatCompletion?.({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: `Write a hypothetical legal case that can perfectly answer or is very related to this query: ${input}` }],
      max_tokens: 500
    })

    const result = await response.json();
    const hypoAnswer = result.choices[0].message.content
    console.log("[Hyde.ts - getHypotheticalAnswer] - Here is my hypo ans.: " + hypoAnswer)
    return hypoAnswer

  } catch (e) {
    console.log("Error calling OpenAI API: ", e);
    throw new Error(`Error calling OpenAI API: ${e}`);
  }
}