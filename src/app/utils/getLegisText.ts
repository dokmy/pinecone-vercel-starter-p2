const cheerio = require('cheerio');

export const getLegisText = async (path: string): Promise<any> => {

    // Given a path, it first extracts cap and subpath. For example, the path is "/en/legis/ord/33/s59" so cap is "33" and subpath is "s59"
    const parts = path.split("/");

    if (parts.length === 6) {
        const abbr = parts[3];
        const cap = parts[4];
        const subpath = parts[5];
        console.log("[getLegisText.ts] abbr: " + abbr)
        console.log("[getLegisText.ts] cap: " + cap)
        console.log("[getLegisText.ts] subpath: " + subpath)

        // Make a request to https://www.hklii.hk/api/getsecversions?lang=en&abbr={abbr}&cap={cap}&subpath={subpath}

        const apiUrl = `https://www.hklii.hk/api/getsecversions?lang=en&abbr=${abbr}&cap=${cap}&subpath=${subpath}`;
        console.log("[getLegisText.ts] apiUrl: " + apiUrl)

        const response = await fetch(apiUrl);
        const data = await response.json();

        const vid = data[0].id;
        console.log("[getLegisText.ts] id: " + vid)

         // With the cap, subpath, and id, it makes a request to https://www.hklii.hk/api/getcapsection?vid={vid}}&subpath={subpath}
        const response2 = await fetch(`https://www.hklii.hk/api/getcapsection?vid=${vid}&subpath=${subpath}`);
        const data2 = await response2.json();

        // Extract the html_content from the "content" key and then use cheerio to extract the text 
        const $ = cheerio.load(data2.content);
        let textContent = $('body').text();

        // Create the cap_number by combining the cap and subpath
        const sectionNumber = subpath.slice(1).replace(/^0+/, '');
        const cap_number = `CAP ${cap} - Section ${sectionNumber}`;

        // Build a case text object with the data2 object plus the textContent and the cap 
        const legisTextObj = {
            ...data2,
            textContent,
            cap,
            cap_number,
        };

        // console.log("[getLegisText.ts] legisText: " + JSON.stringify(legisTextObj, null, 2))

        return legisTextObj;
    } else {
        throw new Error(`Invalid path format: ${path}`);
    }  
   
}