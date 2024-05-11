import { getEmbeddings } from '@/utils/embeddings'
import { getMatchesFromEmbeddings } from '@/utils/pinecone'
import dayjs from "dayjs";
import prismadb from '../../lib/prismadb';
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { getMessageCreditCount } from '@/lib/messageCredits';


interface search_result {
  raw_case_num: string;
  case_title: string;
  case_date: string;
  case_court: string;
  case_neutral_cit: string;
  case_action_no: string;
  url: string;
}


function convertToUrl(caseRef:string, countryOption:string) {

    if (countryOption === "hk") {
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
    } else {
      
      const url = `https://www.bailii.org/uk/cases${caseRef}`
      return url;
    }
    
  }


export async function POST(req: Request) {


    const {userId} = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", {status: 401})
    }

    const creditsLeft = await getMessageCreditCount(userId)

    if (creditsLeft ==0 || creditsLeft == false || creditsLeft < 0) {
      return new NextResponse("No more credits. Please upgrade or buy more credits.", {status: 403})
    }

    try {
      const {  filters, searchQuery, selectedMinDate, selectedMaxDate, sortOption, countryOption } = await req.json()

      const user = await currentUser();
      const userName = user?.firstName + " " + user?.lastName;
      const userEmail = user?.emailAddresses[0].emailAddress;


      // -------Inserting the Search into DB-------
      const searchRecord = await prismadb.search.create({
        data: {
          query: searchQuery,
          prefixFilters: JSON.stringify(filters),
          minDate: selectedMinDate,
          maxDate: selectedMaxDate,
          userId: userId,
          userName: userName,
          userEmail: userEmail,
          countryOption: countryOption
        }
      });


      // -------Starting retrival-------
      console.log("Search API - Here is the search query:",searchQuery, "\n")
      console.log("Search API - Here is the filters:", filters, "\n")

      const embedding = await getEmbeddings(searchQuery)

      const case_prefix_filter = {case_prefix: { "$in": filters}}
      console.log("Search API - Here is the case_prefix_filter: ", case_prefix_filter)

      let matches
      if (filters.length===0){
        matches = await getMatchesFromEmbeddings(embedding, 10, '', countryOption);
      } else {
        matches = await getMatchesFromEmbeddings(embedding, 10, '', countryOption, case_prefix_filter);
      }
      
      console.log("Search API - Retrieval done.")
      console.log("Search API - Number of matches BEFORE deduplication:", matches.length)


      // -------Starting deduplication-------
      const search_results = matches.map((match) => {
        console.log("Search API -  Here is the match: " + JSON.stringify(match))
        const { raw_case_num, cases_title, date, db, neutral_cit, cases_act, case_path = '' } = match.metadata;

        let caseRef = ''

        if (countryOption === "hk") {
          caseRef = raw_case_num
        } else {
          caseRef = case_path
        }
        // Generate url from raw_case_num and countryOption
        const url = convertToUrl(caseRef, countryOption)
    
        return {
        raw_case_num,
        case_title: cases_title,
        case_date: date,
        case_court: db,
        case_neutral_cit: neutral_cit,
        case_action_no: cases_act,
        url: url
        };
        });
      
        const deduplicatedResults = Array.from(new Map(search_results.map(item => [item.raw_case_num, item])).values());

      
      console.log("Search API - De-duplication done.")
      console.log("Search API - Number of matches AFTER deduplication:", deduplicatedResults.length)


      // -------Starting search period filtering-------
      const filteredResults = deduplicatedResults.filter(
        (result: search_result) => {
          const caseDate = dayjs(result.case_date);
          return (
            (caseDate.isSame(selectedMinDate) ||
              caseDate.isAfter(selectedMinDate)) &&
            (caseDate.isSame(selectedMaxDate) ||
              caseDate.isBefore(selectedMaxDate))
          );
        }
      );

      console.log("Search API - Search Period filtering done.")
      console.log("Search API - Number of matches AFTER search period filtering:", filteredResults.length)

      

      // -------Starting sorting-------

      if (sortOption === "Recency") {
        filteredResults.sort((a: search_result, b: search_result) => {
          // Convert case_date strings to Day.js objects for comparison
          const dateA = dayjs(a.case_date);
          const dateB = dayjs(b.case_date);

          // Sort in descending order
          return dateB.diff(dateA);
        });
      }

      console.log("Search API - Results sorting done.")
      console.log("Search API - Number of matches AFTER sorting:", filteredResults.length)
      // console.log("Search API - Here are the final results to pass back and upload to db:", filteredResults)


      // -------If action no or case title is an array, then just get the first one-------
      const processedResults = filteredResults.map(result => {
        const processedResult = { ...result };
      
        if (Array.isArray(processedResult.case_title)) {
          processedResult.case_title = processedResult.case_title[0];
        }
      
        if (Array.isArray(processedResult.case_action_no)) {
          processedResult.case_action_no = processedResult.case_action_no[0];
        }
      
        return processedResult;
      });


      // -------If case_action_no is undefined, then replace it with "N/A"-------
      processedResults.map(result => {
        if (result.case_action_no === undefined) {
          result.case_action_no = "N/A";
        }
      });
      
      console.log("Search API - Here are the final results to pass back and upload to db:", processedResults)


      // -------Inserting search results to DB-------
      await Promise.all(processedResults.map(result => {
        return prismadb?.searchResult.create({
          data: {
            caseName: result.case_title,
            caseNeutralCit: result.case_neutral_cit,
            caseActionNo: result.case_action_no,
            caseDate: dayjs(result.case_date).toISOString(),
            caseUrl: result.url,
            searchId: searchRecord.id,
            userId: userId,
            userName: userName,
            userEmail: userEmail
          }
        })
      }))


      return new Response(JSON.stringify({processedResults, searchId: searchRecord.id}), {
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
  