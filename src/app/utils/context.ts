import { ScoredVector } from "@pinecone-database/pinecone";
import { getMatchesFromEmbeddings } from "./pinecone";
import { getEmbeddings } from './embeddings'
import { filter } from "cheerio/lib/api/traversing";

// export type Metadata = {
//   url: string,
//   text: string,
//   chunk: string,
// }

interface raw_case_num_filter {
  raw_case_num: string
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, filter:string, maxTokens = 3000, minScore = 0.7, getOnlyText = true): Promise<any> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  console.log("context.tx is called. Here is my filter: " + filter + "\n")
  const raw_case_num_filter = {"raw_case_num": filter}
  console.log(raw_case_num_filter)

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 5, namespace, raw_case_num_filter);

  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);
  // console.log("\nStill in context.ts. Here are the qualifyingDocs:\n")
  // console.log(matches)

  let text_array: any[] = []
  matches.map((match) => {
    const metadata = match.metadata
    const node_content = JSON.parse(metadata._node_content)
    const text = node_content.text
    text_array.push(text)
    // console.log(text_array)
  })

  const context_text = text_array.join("\n").substring(0, maxTokens)
  // console.log("End of context.ts. Here is the context text that I will send back to the API:\n" + context_text)
  return context_text
}
