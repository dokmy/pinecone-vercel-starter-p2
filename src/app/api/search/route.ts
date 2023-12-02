import { Configuration, OpenAIApi } from 'openai-edge'
import { getEmbeddings } from '@/utils/embeddings'
import { getMatchesFromEmbeddings } from '@/utils/pinecone'

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })
  const openai = new OpenAIApi(config)

export const runtime = 'edge'

interface case_prefix_filter {
    case_prefix: { "$in": string[]}
  }



function convertToUrl(caseRef:string) {
    // Split the case reference into parts
    const parts = caseRef.split('_');
  
    // Check if the parts array has the expected length
    if (parts.length === 3) {
      const year = parts[0];
      const court = parts[1].toLowerCase(); // Convert to lower case
      const caseNumber = parts[2];
  
      // Construct the URL
      const url = `https://www.hklii.hk/en/cases/${court}/${year}/${caseNumber}`;
      return url;
    } else {
      // Return an error message or handle the error as needed
      return 'Invalid case reference format';
    }
  }


export async function POST(req: Request) {

    try {
      const { searchQuery, filters} = await req.json()
      console.log("Search API is summoned. Here is the search query: \n")
      console.log(searchQuery + "\n")
      console.log("Search API is summoned. Here is the filters: \n")
      console.log(filters + "\n")

      const embedding = await getEmbeddings(searchQuery)

      const case_prefix_filter = {case_prefix: { "$in": filters}}
      console.log("Here is the case_prefix_filter: ", case_prefix_filter)

      let matches
      if (filters.length===0){
        matches = await getMatchesFromEmbeddings(embedding, 10, '');
      } else {
        matches = await getMatchesFromEmbeddings(embedding, 10, '', case_prefix_filter);
      }
      

      console.log("Here are the matches:")
      console.log(matches.length)

      const search_results = matches.map((match) => {
        const { raw_case_num, cases_title, date, db, neutral_cit, cases_act } = match.metadata;
    
        return {
        raw_case_num,
        case_title: cases_title,
        case_date: date,
        case_court: db,
        case_neutral_cit: neutral_cit,
        case_action_no: cases_act,
        url: convertToUrl(raw_case_num)
        };
        });
      
        const deduplicatedResults = Array.from(new Map(search_results.map(item => [item.raw_case_num, item])).values());

      console.log(deduplicatedResults);
      console.log(search_results.length)
      console.log(deduplicatedResults.length)

      return new Response(JSON.stringify({deduplicatedResults}), {
        headers: { 'Content-Type': 'application/json'}
      })

    } catch (e) {
        console.error('Error in /api/search:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  }
  