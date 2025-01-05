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
  console.log("\n🔎 CONTEXT RETRIEVAL:");
  console.log("Message:", message);
  console.log("Filter:", JSON.stringify(neutral_cit_filter, null, 2));
  console.log("Country Option:", countryOption);
  console.log("Max Tokens:", maxTokens);
  console.log("Min Score:", minScore);

  // If we have a specific case filter, use a dummy vector to get all chunks for that case
  let embedding;
  if (filter) {
    console.log("\n📌 Using dummy vector for specific case filter");
    // Create a dummy vector of zeros with dimension 1536
    embedding = new Array(1536).fill(0);
  } else {
    console.log("\n🔤 Getting embeddings for message");
    // Otherwise use the query to find semantically similar chunks
    embedding = await getEmbeddings(message);
  }

  console.log("\n🔄 Retrieving matches from Pinecone...");
  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 5, namespace, countryOption, neutral_cit_filter);

  // Log the first 200 characters of each chunk
  console.log("\n📑 Retrieved Chunks:");
  if (matches.length === 0) {
    console.log("❌ No chunks found!");
  }
  matches.forEach((match, index) => {
    const metadata = match.metadata
    const node_content = JSON.parse(metadata._node_content)
    const text = node_content.text
    console.log(`\n📄 Chunk ${index + 1} (first 200 chars):`)
    console.log(text.substring(0, 200))
  })

  let text_array: any[] = []
  matches.map((match) => {
    const metadata = match.metadata
    const node_content = JSON.parse(metadata._node_content)
    const text = node_content.text
    text_array.push(text)
  })

  console.log("\n📊 Final Context Stats:");
  console.log("Number of chunks:", matches.length);
  console.log("Total text length:", text_array.join("\n").length);

  const context_text = text_array.join("\n").substring(0, maxTokens)
  return context_text
}
