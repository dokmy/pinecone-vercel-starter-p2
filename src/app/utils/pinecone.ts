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

  if (countryOption === "hk") {
    indexName = process.env.PINECONE_INDEX_HK || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX_HK environment variable not set')
    }
  } else {
    indexName = process.env.PINECONE_INDEX_UK || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX_UK environment variable not set')
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

  
  // if (filter){
  //   if ("neutral_cit" in filter){
  //     queryObject.filter = filter
  //   } else if (countryOption === "hk"){
  //     console.log("Pinecone.ts -  HK!!!!", filter)
  //     queryObject.filter = { case_prefix: { "$in": filter} }
  //   } else if (countryOption === "uk"){
  //     queryObject.filter = { db: { "$in": filter}}
  //   }
  // }

  console.log("Pinecone.ts -  Here is the filter I will send to Pinecone.ts: ", queryObject.filter)

  try {
    // Query the index with the defined request
    const queryResult = await pineconeNamespace.query(queryObject)

    if (queryResult.matches) {
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
    console.log("Error querying embeddings: ", e)
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

export { getMatchesFromEmbeddings }
