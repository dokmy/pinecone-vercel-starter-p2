import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from './embeddings'
import { getSearchKeywords } from "./getSearchKeywords";
import { getRelevantLegis } from "./getRelevantLegis";

export const getRelevantCases = async (message: string): Promise<any> => {

    console.log("[getRelevantCases.ts] I am called. Here is the message: " + message)

    // Get hypothetical answers from the user's query
    const searchKeywords = await getSearchKeywords(message)
    console.log("[getRelevantCases.ts] searchKeywords: " + searchKeywords)

    // Get the embeddings of the input message
    const embeddings = await getEmbeddings(searchKeywords);

    // Perform search on HKLII API to retrieve relevant laws   
    const relevantLegis = await getRelevantLegis(searchKeywords)
  
    // Initialize the Pinecone client and retrieve the matches for the embeddings from the specified namespace
    
    const pinecone = new Pinecone();
    
    const indexName: string = process.env.PINECONE_INDEX || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX environment variable not set')
    }

    console.log("[getRelevantCases.ts] indexName: " + indexName)

    const index = pinecone!.Index(indexName);

    const pineconeNamespace = index.namespace('');

    const queryObject:any = {
        vector: embeddings,
        topK: 20,
        includeMetadata: true
      };

    const matches = await pineconeNamespace.query(queryObject);

    // Extract the raw_case_num from the metadata with the forEach loop
    let raw_case_nums:any = []
    matches.matches?.forEach(match => {
        raw_case_nums.push(match.metadata?.raw_case_num)
    })

    // Deduplicate the raw_case_nums array
    raw_case_nums = [...new Set(raw_case_nums)]
    console.log("[getRelevantCases.ts] raw_case_nums: " + raw_case_nums)

    return raw_case_nums
    
}

  
  