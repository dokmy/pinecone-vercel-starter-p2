export const getRelevantLegis = async (keywords: string): Promise<string[]> => {
    console.log("[getRelevantLegis.ts] I am called. Here is the keywords: " + keywords);
    
    try {

        const fetch_url = `https://www.hklii.hk/api/advancedsearch?searchType=advanced&anyword=${keywords}&dbs=27,29,31,33,35,37,39,41,51`
        
        console.log("[getRelevantLegis.ts] fetch_url: " + fetch_url)

        const response = await fetch(fetch_url);

        const data = await response.json();
        
        // Extract the paths from the results, excluding paths containing "/cases"
        const paths = data.results
            .map((result:any) => result.path)
            .filter((path:string) => !path.includes("/cases"))
            .slice(0, 10);
        
        console.log("[getRelevantLegis.ts] paths: " + paths)
        
        return paths;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
};