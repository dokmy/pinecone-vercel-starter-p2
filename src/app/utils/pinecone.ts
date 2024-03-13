import { Pinecone, type ScoredPineconeRecord } from "@pinecone-database/pinecone";

// export type Metadata = {
//   url: string,
//   text: string,
//   chunk: string,
//   hash: string
// }

interface neutral_cit_filter {
  "neutral": string
}

interface case_prefix_filter {
  case_prefix: { "$in": string[]}
}

type metadata_filter = neutral_cit_filter | case_prefix_filter

// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string, filter?:metadata_filter): Promise<any[]> => {
  console.log("[Pinecone.ts - getMatchesFromEmbeddings] -  Here is my filter: " + filter + "\n")
  
  // Obtain a client for Pinecone
  const pinecone = new Pinecone();

  const indexName: string = process.env.PINECONE_INDEX || '';
  if (indexName === '') {
    throw new Error('PINECONE_INDEX environment variable not set')
  }

  const index = pinecone!.Index(indexName);

  // Get the namespace
  // const pineconeNamespace = index.namespace(namespace ?? '')

  const queryObject:any = {
    vector: embeddings,
    topK,
    includeMetadata: true
  };

  if (filter){
    queryObject.filter = filter
  }

  try {
    // Query the index with the defined request
    const queryResult = await index.query(queryObject)

    console.log("[Pinecone.ts] - queryResult: ", queryResult.matches)
    

    if (queryResult.matches) {
      queryResult.matches.forEach(match => {
        if (match.metadata && typeof match.metadata.text === 'string') {
          const result_text = match.metadata.text
          // console.log("[Pinecone.ts] - Dates of matches: " + match.metadata?.date + "\n");
        }

      });
    }

    return queryResult.matches || []
  } catch (e) {
    // Log the error and throw it
    console.log("Error querying embeddings: ", e)
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

export { getMatchesFromEmbeddings }
