import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected response structure
type EvaluationResponse = {
  score: number;  // Score out of 10
}

export async function POST(req: Request) {
  try {
    const { query, chunk } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a legal document relevance evaluator. Evaluate how relevant a text chunk is to a given query.
          Return your evaluation in JSON format with a single field:
          - score: a number from 0 to 10 indicating relevance (10 being most relevant)
          
          Example response format:
          {
            "score": 7
          }
          
          Focus only on providing a score, no explanation needed.`
        },
        {
          role: "user",
          content: `Query: "${query}"
          
          Text chunk to evaluate: "${chunk}"`
        }
      ],
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const evaluation: EvaluationResponse = JSON.parse(result);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error in evaluate-relevance:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate relevance' },
      { status: 500 }
    );
  }
} 