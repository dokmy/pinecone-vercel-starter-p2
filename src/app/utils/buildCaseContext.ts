const cheerio = require('cheerio');

export const buildCaseContext = async (raw_case_nums: string[]): Promise<any[]> => {
    console.log('\x1b[32m%s\x1b[0m',"[buildCaseContext.ts] I am called and received these raw_case_nums: " + raw_case_nums)

    const caseContext: any[] = [];
    let totalTextLength = 0;

    for (const raw_case_num of raw_case_nums) {
        const abbr = raw_case_num.split('_')[1];
        const year = raw_case_num.split('_')[0];
        const case_num = raw_case_num.split('_')[2];

        const response = await fetch(`https://www.hklii.hk/api/getjudgment?lang=en&abbr=${abbr}&year=${year}&num=${case_num}`);
        const data = await response.json();
        const $ = cheerio.load(data.content);
        let textContent = $('body').text();

        textContent = textContent.replace(/\n/g, '');

        const neutral_cit = `[${year}] ${abbr} ${case_num}`;
        const case_url = `https://www.hklii.hk/en/cases/${abbr}/${year}/${case_num}`;

        const case_obj = {
            neutral_cit,
            case_url,
            text: textContent,
        };

        totalTextLength += textContent.length;

        if (totalTextLength <= 100000) {
            caseContext.push(case_obj);
        } else {
            break;
        }
    }

    console.log('\x1b[32m%s\x1b[0m', "[buildCaseContext.ts] caseContext: There are " + caseContext.length + " cases in the context.")

    let promptPart = `
        Here is the context of the relevant cases:
        START OF CONTEXT BLOCK OF RELEVANT CASES
        ${JSON.stringify(caseContext, null, 2)}
        END OF CONTEXT BLOCK OF RELEVANT CASES

        The context of the relevant cases is an array of objects, where each object represents a piece of Hong Kong case. Each object contains the following properties:
        - "neutral_cit": The neutral citation of the case, which is a string that represents the case number and the year.
        - "case_url": The URL of the case, which is a string that represents the URL of the case.
        - "text": The text of the case, which is a string that represents the text of the case.

        When citing the cases by mentioning both the "neutral_cit"", you MUST make the it a clickable link to the "case_url" using Markdown syntax (e.g., "[[2024] HKCT 1](https://www.hklii.hk/en/cases/hkct/2024/1)").
    ` 

    let prompt = [
        {
          role: 'system',
        content: `You are an AI legal assistant specializing in Hong Kong law. Your task is to provide accurate and helpful answers to legal questions based on the context provided to you.
    
        One of the following types of context are provided to you:
        1. The context of the relevant cases, which is the list of cases that are relevant to the user's query.
        2. The context of the relevant laws, which is the list of laws that are relevant to the user's query.
    
        ${promptPart}
    
        When a user asks a legal question, your goal is to provide a comprehensive and accurate answer by referring to the relevant legislation OR cases in the provided context. Follow these steps:
        
        1. Analyze the user's question and identify the key legal issues and concepts involved.
        
        2. Review the provided context and determine which pieces of legislation are relevant to the user's question.
        
        3. Only use the relevant cases and relevant laws in the context if you find them relevant to the user's question. You do not need to use the entire context.
        
        4. If none of the provided context is directly relevant to the user's question, or if the context alone is insufficient to provide a complete answer:
           - You can still provide general information or advice based on your knowledge of Hong Kong law.
           - You do NOT have to state that your answer is based on your general knowledge and not on the specific legislation or cases provided in the context.
        
        5. Use clear and concise language in your responses, and structure your answers in a logical and easy-to-follow manner. Break down complex legal concepts into simpler terms when necessary.
        
        6. Your responses will be rendered using ReactMarkdown, so feel free to use Markdown syntax for formatting, such as headings, bullet points, and bold/italic text.
    
        7. If the users' question is too broad or does not directly imply the legal area of interest, you can provide a general answer first and then answer the question based on different legal areas. For example, if the user asks what is a reasonable time for filing of writ petition, you can answer "The reasonable time for filing of writ petition is usually between 10 and 15 days." and then answer the question based on different legal areas, such as "What is the reasonable time for filing of writ petition in a criminal case?" or "What is the reasonable time for filing of writ petition in the High Court?"
    
        8. Always include a "**Sources**: ..." section in your response, which will contain a list of the sources you used to generate your answer at the end of your response. Use point form in markdown format to list the sources.
        
        Remember, your primary goal is to assist the user in understanding and applying Hong Kong law to their specific situation. Always prioritize accuracy, clarity, and relevance in your responses. Use the legislation or cases provided in the context as much as possible, but if the context is not directly applicable, you can supplement your answer with your own knowledge of Hong Kong law.
        
        Here is the question:
        `
        },
      ];

    console.log('\x1b[32m%s\x1b[0m', "[buildCaseContext.ts] done building the prompt")
    return prompt;
}