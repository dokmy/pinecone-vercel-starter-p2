import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function getSearchKeywords(message: string, database: string): Promise<any> {
  
  let content = ""  
  if (database === "judgement") {
    content = `
    Please generate a list of paragraphs relevant to the given legal query. These paragraphs will be used to do a vector search in a database of the Hong Kong Legislations. Your response should only contain the paragraphs and nothing else. Each paragraph can be contain 5-10 sentences.

        For the given query, follow these steps:
        1. Analyze the query to identify key legal issues, entities, and concepts.
        2. Imagine in the real world, what will a judgment or case that perfectly matches the query look like. For example, if the query is "My client has a personal injury during lunch time at work. Is he eligbale for compensation from his employer?", a perfect judgment or case would be one that clearly states the client's injury, the time of the injury, and the compensation the client is eligible for.
        2. Generate precisely 3-5 paragraphs that are most likely to appear in this perfect judgment or case.
        3. Ensure that the generated paragraphs can cover different aspects, sub-topics, and related terms associated with the user's query.
        4. Return these 3-5 paragraphs separated by a comma (","), without any additional text or explanations.

        IMPORTANT: Please only return these paragraphs, not any additional text or explanations.
        
        Please generate paragraphs for the following legal query:
        ${message}
    `
  } else {
    content = `Please generate a list of keywords relevant to the given legal query. These keywords will be used to search a database of the Hong Kong Legislations. Your response should only contain the keywords and nothing else. Each keyword can be a single word or a phrase or a combination of words.

    For the given query, follow these steps:
    1. Analyze the query to identify key legal issues, entities, and concepts.
    2. Generate precisely 2 keywords that are most likely to appear in the relevant legislation.
    3. Ensure that the generated keywords are not too broad (e.g. "of", "the", "law").
    4. Return the 2 keywords separated by a vertical bar ("OR") character, without any additional text or explanations.
    
    Example of a correct response:
    personal injury | traffic accident
    
    Example of an incorrect response:
    The keywords related to the query are:
    1. personal injury - injury caused by someone else's negligence
    2. road accident - an accident that occurs on the road
    3. traffic regulation - laws governing traffic and transportation

    IMPORTANT: The keywords should be single-word and not too broad. Do not include any additional text or explanations in your response.
    
    Please generate keywords for the following legal query:
    ${message}
    
    `
  }

  const completion = await openai.chat.completions.create({
    messages: [{
        role: "user",
        content: content
    } ],
    model: "gpt-3.5-turbo",
    max_tokens: 100,
    temperature: 0
  });

  console.log('\x1b[33m%s\x1b[0m', "[getSearchKeywords.ts] completion: " + completion.choices[0]?.message?.content || "");
  return completion.choices[0]?.message?.content || "";
}


// export const getSearchKeywords = async (message: string): Promise<any> => {

//       const Groq = require("groq-sdk");
//       const groq = new Groq({
//           apiKey: process.env.GROQ_API_KEY
//       });
      
//         const completion = await groq.chat.completions.create({
//             messages: [
//                     {
//                         role: "user",
//                         content: `Please generate a list of keywords relevant to the given legal query. These keywords will be used to search a database of the Hong Kong Legislations. Your response should only contain the keywords and nothing else. Each keyword can be a single word or a phrase or a combination of words.

//                         For the given query, follow these steps:
//                         1. Analyze the query to identify key legal issues, entities, and concepts.
//                         2. Generate precisely 5 keywords that are most likely to appear in the relevant legislation.
//                         3. Ensure that the generated keywords cover different aspects, sub-topics, and related terms associated with the user's query.
//                         4. Return the 5 keywords separated by a vertical bar ("|") character, without any additional text or explanations.
                        
//                         Example of a correct response:
//                         injury|accident|traffic|road|negligence

//                         Another example of a correct response:
//                         tax evasion | income underreporting | freelance graphic design business
                        
//                         Example of an incorrect response:
//                         The keywords related to the query are:
//                         1. personal injury - injury caused by someone else's negligence
//                         2. road accident - an accident that occurs on the road
//                         3. traffic regulation - laws governing traffic and transportation

                        
//                         Please generate keywords for the following legal query:
//                         ${message}
                        
//                         `
//                     } 
//                 ],
//             model: "mixtral-8x7b-32768",
//             max_tokens: 1000
//         });
        
//         console.log('\x1b[33m%s\x1b[0m', "[getSearchKeywords.ts] completion: " + completion.choices[0]?.message?.content || "");
//         return completion.choices[0]?.message?.content || "";


// }



