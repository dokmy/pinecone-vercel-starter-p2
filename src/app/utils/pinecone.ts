import { Pinecone } from "@pinecone-database/pinecone";

interface neutral_cit_filter {
  neutral_cit: string
}

interface case_prefix_filter {
  case_prefix: { "$in": string[]}
}

interface db_filter {
  db: { "$in": string[]}
}

interface search_filter {
  "$and": any[]
}

type metadata_filter = neutral_cit_filter | case_prefix_filter | db_filter | search_filter


// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string, countryOption: string, filter?:any): Promise<any[]> => {
  
  console.log("Pinecone.ts -  Here is my countryOption: " + countryOption)
  console.log("Pinecone.ts -  Here is the filter I received from search API: " + JSON.stringify(filter))
  
  // Obtain a client for Pinecone
  const pinecone = new Pinecone();

  let indexName: string;

  if (countryOption === "uk") {
    indexName = process.env.PINECONE_INDEX_UK || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX_UK environment variable not set')
    }
  } else {
    // Default to HK index for undefined or "hk"
    indexName = process.env.PINECONE_INDEX_HK || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX_HK environment variable not set')
    }
  }

  console.log("Pinecone.ts -  Here is my indexName: " + indexName)


  // Retrieve the list of indexes to check if expected index exists
  const data = await pinecone.listIndexes()

  const extractNames = (indexes:any[]): { name: string }[] => {
    return indexes.map((index) => ({
      name: index.name,
    }));
  };

  const indexNames = data.indexes ? extractNames(data.indexes) : [];

  if (indexNames.filter((i) => i.name === indexName).length !== 1) {
    throw new Error(`Index ${indexName} does not exist`)
  }

  // Get the Pinecone index
  const index = pinecone!.Index(indexName);

  // Get the namespace
  const pineconeNamespace = index.namespace(namespace ?? '')

  const queryObject:any = {
    vector: embeddings,
    topK,
    includeMetadata: true,
    filter: filter
  };

  console.log("\n🔍 PINECONE QUERY DETAILS:");
  console.log("Index Name:", indexName);
  console.log("Namespace:", namespace);
  console.log("Filter:", JSON.stringify(filter, null, 2));
  console.log("Top K:", topK);
  
  try {
    // Query the index with the defined request
    console.log("\n📡 Sending query to Pinecone...");
    const queryResult = await pineconeNamespace.query(queryObject)
    console.log("\n✅ Pinecone response received");
    console.log("Number of matches:", queryResult.matches?.length || 0);

    if (queryResult.matches) {
      // console.log("\n📄 First match details (if any):");
      if (queryResult.matches.length > 0) {
        const firstMatch = queryResult.matches[0];
        // console.log("Score:", firstMatch.score);
        // console.log("Metadata:", JSON.stringify(firstMatch.metadata, null, 2));
      }

      queryResult.matches.forEach(match => {
        if (match.metadata && typeof match.metadata._node_content === 'string') {
          const nodeContent = JSON.parse(match.metadata._node_content);
          // console.log("Match text: " + nodeContent.text + "\n");
        }
      });
    }

    return queryResult.matches || []
  } catch (e) {
    // Log the error and throw it
    console.log("\n❌ Error querying Pinecone:");
    console.log(e)
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

export { getMatchesFromEmbeddings }
