import { Pinecone, type ScoredPineconeRecord } from "@pinecone-database/pinecone";

// export type Metadata = {
//   url: string,
//   text: string,
//   chunk: string,
//   hash: string
// }

interface raw_case_num_filter {
  raw_case_num: string
}

interface case_prefix_filter {
  case_prefix: { "$in": string[]}
}

type metadata_filter = raw_case_num_filter | case_prefix_filter

// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string, filter?:metadata_filter): Promise<any[]> => {
  console.log("pinecone.tx is called. Here is my filter: " + filter + "\n")
  
  // Obtain a client for Pinecone
  const pinecone = new Pinecone();

  const indexName: string = process.env.PINECONE_INDEX || '';
  if (indexName === '') {
    throw new Error('PINECONE_INDEX environment variable not set')
  }

  // Retrieve the list of indexes to check if expected index exists
  const indexes = await pinecone.listIndexes()
  if (indexes.filter(i => i.name === indexName).length !== 1) {
    throw new Error(`Index ${indexName} does not exist`)
  }

  // Get the Pinecone index
  // const index = pinecone!.Index<Metadata>(indexName);
  const index = pinecone!.Index(indexName);

  // Get the namespace
  const pineconeNamespace = index.namespace(namespace ?? '')

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
    const queryResult = await pineconeNamespace.query(queryObject)
    console.log("\nHere are the queryResults: " + queryResult.matches)
    return queryResult.matches || []
  } catch (e) {
    // Log the error and throw it
    console.log("Error querying embeddings: ", e)
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

export { getMatchesFromEmbeddings }
