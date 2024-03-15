export const getSearchKeywords = async (message: string): Promise<any> => {

      const Groq = require("groq-sdk");
      const groq = new Groq({
          apiKey: process.env.GROQ_API_KEY
      });
      
        const completion = await groq.chat.completions.create({
            messages: [
                    {
                        role: "user",
                        content: `You are an AI legal assistant tasked with generating a list of keywords that are highly relevant to a given user query. These keywords will be used to search a database of the Hong Kong Legislations.

                        For each user query, follow these steps:
                        1. Analyze the query to identify key legal issues, entities, and concepts.
                        2. Generate a list of 3-5 keywords that will most likely appear in the relevant legislation.
                        3. Ensure that the generated keywords cover different aspects, sub-topics, and related terms associated with the user's query.
                        4. Please return the list of 3-5 keywords in a string format and insert "OR" between each keyword. For example, "personal injury OR road accident OR traffic accident OR traffic collision OR traffic accident".
                        
                        Here is the user's query:
                        ${message},
                        
                        `
                    } 
                ],
            model: "mixtral-8x7b-32768",
            max_tokens: 100
        });
        console.log("[getSearchKeywords.ts] completion: " + completion.choices[0]?.message?.content || "");
        return completion.choices[0]?.message?.content || "";


}



