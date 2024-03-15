export const getSearchKeywords = async (message: string): Promise<any> => {

      const Groq = require("groq-sdk");
      const groq = new Groq({
          apiKey: process.env.GROQ_API_KEY
      });
      
        const completion = await groq.chat.completions.create({
            messages: [
                    {
                        role: "user",
                        content: `You are an AI legal assistant tasked with generating a list of keywords that are highly relevant to a given user query. These generated keywords will be used to augment the retrieval process in a chatbot system that answers legal questions. Your goal is to create a comprehensive list of keywords that can help the chatbot provide more accurate and relevant responses.

                        For each user query, follow these steps:
                        1. Analyze the query to identify key legal issues, entities, and concepts.
                        2. Generate a list of 20-30 keywords that are highly relevant to the identified issues and concepts from the user's query. 
                        3. Ensure that the generated keywords cover different aspects, sub-topics, and related terms associated with the user's query.
                        4. Use clear and concise terms, and format the list using markdown.
                        
                        Here is the user's query:
                        ${message},
                        
                        Please return the list of keywords in a string format and add "OR" between them:`
                    }
                ],
            model: "mixtral-8x7b-32768",
            max_tokens: 100
        });
        console.log("[getSearchKeywords.ts] completion: " + completion.choices[0]?.message?.content || "");
        return completion.choices[0]?.message?.content || "";


}



