import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from './embeddings'

export const getRelevantCases = async (searchKeywords: string): Promise<any> => {

    console.log('\x1b[34m%s\x1b[0m',"[getRelevantCases.ts] I am called. Here is the searchKeywords: " + searchKeywords)

    // Get the embeddings of the searchKeywords
    const embeddings = await getEmbeddings(searchKeywords);

    // Initialize the Pinecone client and retrieve the matches for the embeddings from the specified namespace
    
    const pinecone = new Pinecone();
    
    const indexName: string = process.env.PINECONE_INDEX || '';
    if (indexName === '') {
      throw new Error('PINECONE_INDEX environment variable not set')
    }

    console.log('\x1b[34m%s\x1b[0m',"[getRelevantCases.ts] indexName: " + indexName)

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
    console.log('\x1b[34m%s\x1b[0m',"[getRelevantCases.ts] raw_case_nums: " + raw_case_nums)

    return raw_case_nums
    
}

  
  