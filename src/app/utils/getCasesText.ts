const cheerio = require('cheerio');

export const getCasesText = async (raw_case_nums: string[]): Promise<any> => {

    console.log("[getCasesText.ts] I am called. Here is the raw_case_nums: " + raw_case_nums)

    // For each raw_case_num, make a request to https://www.hklii.hk/api/getjudgment?lang=en&abbr={abbr}&year={year}&num={case_num} to get the text of the case
    const casesText = await Promise.all(raw_case_nums.map(async (raw_case_num) => {
        // Extra abbr, year and case_num from the raw_case_num. For example, if the raw_case_num is "2023_HKLDT_25", the abbr is "HKLDT", year is "2023" and case_num is "25"
        const abbr = raw_case_num.split('_')[1];
        const year = raw_case_num.split('_')[0];
        const case_num = raw_case_num.split('_')[2];

        const response = await fetch(`https://www.hklii.hk/api/getjudgment?lang=en&abbr=${abbr}&year=${year}&num=${case_num}`);
        const data = await response.json();
        // console.log(data)
        const $ = cheerio.load(data.content);
        let textContent = $('body').text();

        // Remove all occurrences of \n using regex
        textContent = textContent.replace(/\n/g, '');

        // Build the neutral_cit from the raw_case_num. If the raw_case_num is "2023_HKLDT_25", the neutral_cit is "[2003] HKLDT 25"
        const neutral_cit = `[${year}] ${abbr} ${case_num}`;

        // Build an object with two keys: neutral_cit and text
        const case_obj = {
            neutral_cit,
            text: textContent,
        };

        // console.log("[getCasesText.ts] case_obj: " , case_obj)
        return case_obj;

    }));
    return casesText;
}