import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

export async function rerank(query: string, documents: string[]) {
  try {
    console.log('Calling Cohere rerank with:', {
      query,
      numDocuments: documents.length,
      sampleDoc: documents[0]?.slice(0, 100)
    });

    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        documents,
        model: 'rerank-english-v2.0',
        top_n: 20,
        return_documents: false
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Cohere response:', {
      numResults: data.results.length,
      topScore: data.results[0]?.relevance_score,
      sampleScores: data.results.slice(0, 3).map((r: any) => r.relevance_score)
    });

    return data.results;
  } catch (error) {
    console.error('Error in rerank:', error);
    return [];
  }
} 