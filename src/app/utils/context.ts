import { getMatchesFromEmbeddings } from "./pinecone";
import { getEmbeddings } from './embeddings'
import { filter } from "cheerio/lib/api/traversing";

// export type Metadata = {
//   url: string,
//   text: string,
//   chunk: string,
// }

interface neutral_cit_filter {
  "neutral": string
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, filter:string, maxTokens = 1000, minScore = 0.7, getOnlyText = true): Promise<any> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  console.log("[Context.ts - getContext] - Here is my filter: " + filter)
  const neutral_cit_filter = {"neutral": filter}
  console.log("[Context.ts - getContext] - Here is my neutral_cit_filter_object: " + neutral_cit_filter)

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 5, namespace, neutral_cit_filter);

  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);
  // console.log("\nStill in context.ts. Here are the qualifyingDocs:\n")
  // console.log(matches)

  let text_array: any[] = []
  matches.map((match) => {
    const metadata = match.metadata
    const node_text = metadata.chunk_text
    // console.log("[Context.ts - getContext] - Here is the node_text: " + node_text)
    // const text = node_content.text
    text_array.push(node_text)
    // console.log(text_array)
  })

  const context_text = text_array.join("\n").substring(0, maxTokens)

  return context_text
}
