export const getRelevantLegis = async (searchKeywords: string): Promise<string[]> => {
    console.log('\x1b[36m%s\x1b[0m',"[getRelevantLegis.ts] I am called. Here is the searchKeywords: " + searchKeywords);
    
    try {

        const fetch_url = `https://www.hklii.hk/api/advancedsearch?searchType=advanced&text=${searchKeywords}&dbs=27,29,31,33,35,37,39,41,51`
        
        console.log('\x1b[36m%s\x1b[0m',"[getRelevantLegis.ts] fetch_url: " + fetch_url)

        const response = await fetch(fetch_url);

        const data = await response.json();
        
        // Extract the paths from the results, excluding paths containing "/cases"
        const paths = data.results
            .map((result:any) => result.path)
            .filter((path:string) => !path.includes("/cases"))
            .slice(0, 20);
        
        console.log('\x1b[36m%s\x1b[0m',"[getRelevantLegis.ts] Number of paths to send out: " + paths.length)
        
        return paths;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
};