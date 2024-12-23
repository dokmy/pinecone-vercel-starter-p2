import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getRefinedQuery(originalQuery: string): Promise<string> {
  const prompt = `You are an expert assistant specializing in creating refined search queries. I will provide you with a detailed case or scenario. Your task is to extract key themes, keywords, and concepts from it and generate a concise query for searching a legal database. The refined query should focus on retrieving relevant documents while excluding unnecessary details. Ensure your response consists solely of the query itself, with no additional explanations, commentary, or formatting.

Here is the scenario:
${originalQuery}

Important: Output only the query text, without any extra words or explanations.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || originalQuery;
} 