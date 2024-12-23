import { getMatchesFromEmbeddings } from "./pinecone";
import { getEmbeddings } from './embeddings'
import { filter } from "cheerio/lib/api/traversing";

// export type Metadata = {
//   url: string,
//   text: string,
//   chunk: string,
// }

interface neutral_cit_filter {
  neutral_cit: string
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, filter:string, countryOption: string, maxTokens = 25000, minScore = 0.7): Promise<any> => {

  const neutral_cit_filter = {"neutral_cit": filter}
  console.log("\n=== Context for case", filter, "===")
  console.log("Context.ts -  Here is my filter: " + JSON.stringify(neutral_cit_filter))
  console.log("Context.ts -  Here is my countryOption: " + countryOption)

  // If we have a specific case filter, use a dummy vector to get all chunks for that case
  let embedding;
  if (filter) {
    // Create a dummy vector of zeros with dimension 1536
    embedding = new Array(1536).fill(0);
  } else {
    // Otherwise use the query to find semantically similar chunks
    embedding = await getEmbeddings(message);
  }

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 5, namespace, countryOption, neutral_cit_filter);

  // Log the first 200 characters of each chunk
  console.log("\nChunks retrieved:")
  matches.forEach((match, index) => {
    const metadata = match.metadata
    const node_content = JSON.parse(metadata._node_content)
    const text = node_content.text
    console.log(`\nChunk ${index + 1} (first 200 chars):`)
    console.log(text.substring(0, 200))
  })

  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);

  let text_array: any[] = []
  matches.map((match) => {
    const metadata = match.metadata
    const node_content = JSON.parse(metadata._node_content)
    const text = node_content.text
    text_array.push(text)
  })

  const context_text = text_array.join("\n").substring(0, maxTokens)
  return context_text
}
