

export const getSearchKeywords = async (message: string): Promise<any> => {

      const Groq = require("groq-sdk");
      const groq = new Groq({
          apiKey: process.env.GROQ_API_KEY
      });
      
        const completion = await groq.chat.completions.create({
            messages: [
                    {
                        role: "user",
                        content: `Please generate a list of keywords relevant to the given legal query. These keywords will be used to search a database of the Hong Kong Legislations. Your response should only contain the keywords and nothing else. Each keyword can be a single word or a phrase or a combination of words.

                        For the given query, follow these steps:
                        1. Analyze the query to identify key legal issues, entities, and concepts.
                        2. Generate precisely 5 keywords that are most likely to appear in the relevant legislation.
                        3. Ensure that the generated keywords cover different aspects, sub-topics, and related terms associated with the user's query.
                        4. Return the 5 keywords separated by a vertical bar ("|") character, without any additional text or explanations.
                        
                        Example of a correct response:
                        injury|accident|traffic|road|negligence

                        Another example of a correct response:
                        tax evasion | income underreporting | freelance graphic design business
                        
                        Example of an incorrect response:
                        The keywords related to the query are:
                        1. personal injury - injury caused by someone else's negligence
                        2. road accident - an accident that occurs on the road
                        3. traffic regulation - laws governing traffic and transportation

                        
                        Please generate keywords for the following legal query:
                        ${message}
                        
                        `
                    } 
                ],
            model: "mixtral-8x7b-32768",
            max_tokens: 1000
        });
        
        console.log('\x1b[31m%s\x1b[0m', "[getSearchKeywords.ts] completion: " + completion.choices[0]?.message?.content || "");
        return completion.choices[0]?.message?.content || "";


}



