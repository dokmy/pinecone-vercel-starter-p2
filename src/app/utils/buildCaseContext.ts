const cheerio = require('cheerio');

export const buildCaseContext = async (raw_case_nums: string[]): Promise<any[]> => {
    console.log("[buildCaseContext.ts] I am called. Here is the raw_case_nums: " + raw_case_nums)

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

        if (totalTextLength <= 70000) {
            caseContext.push(case_obj);
        } else {
            break;
        }
    }

    console.log('\x1b[31m%s\x1b[0m', "[buildCaseContext.ts] caseContext: There are " + caseContext.length + " cases in the context.")
    return caseContext;
}