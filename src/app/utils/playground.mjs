import { Pinecone } from "@pinecone-database/pinecone";


const PINECONE_API_KEY='0839339f-3f7c-4583-a640-369e8c2802eb'

async function main() {
  
  const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
  });
  const indexName= "2024-legal-cases-3";
  const index = pinecone.Index(indexName);

  // const stats = await index.describeIndexStats();
  // console.log(stats);

  const result = await index.query({
    topK: 3,
    vector: new Array(1536).fill(0),
    includeMetadata: true
  })

  console.log(result);

}

main()