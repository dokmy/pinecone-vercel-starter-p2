import * as cheerio from 'cheerio';

export interface SerperOrganicResult {
  link: string;
  title: string;
  snippet: string;
  content?: string;
}

interface SerperResponse {
  organic: SerperOrganicResult[];
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove all unnecessary elements
    $('script, style, head, nav, footer, iframe, img, header, noscript, svg, path, button, input, meta, link').remove();
    
    // Remove all elements with these common class/id patterns
    $('[class*="menu"], [class*="nav"], [class*="header"], [class*="footer"], [id*="menu"], [id*="nav"], [id*="header"], [id*="footer"]').remove();

    // Get only the main content area if it exists
    let content = $('.content-block').text() || $('main').text() || $('article').text();
    
    // If no specific content area found, fall back to body
    if (!content.trim()) {
      content = $('body').text();
    }

    // Clean up the text
    return content
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/\t+/g, ' ')  // Replace tabs with space
      .replace(/\r/g, '')    // Remove carriage returns
      .trim();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return ''; // Return empty string if fetch fails
  }
}

export async function serperSearch(query: string) {
  console.log('📡 Fetching results from Serper...');
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: `site:en-rules.hkex.com.hk ${query}`,
      num: 10
    })
  });

  if (!response.ok) {
    throw new Error('Search API request failed');
  }

  const data = await response.json() as SerperResponse;
  
  // Filter out PDFs and non-HKEX results
  data.organic = data.organic
    .filter(result => {
      const isPDF = result.link.toLowerCase().endsWith('.pdf');
      const isHKEX = result.link.startsWith('https://en-rules.hkex.com.hk/');
      return isHKEX && !isPDF;
    })
    .slice(0, 5); // Keep top 5 results for metadata

  // Fetch content only for first 2 results
  console.log('🔍 Fetching page contents for top 2 results...');
  const contentPromises = data.organic
    .slice(0, 2)
    .map(result => fetchPageContent(result.link));
  const contents = await Promise.all(contentPromises);

  // Add content to first 2 results, leave others as is
  data.organic = data.organic.map((result, index) => ({
    ...result,
    content: index < 2 ? contents[index] : undefined
  }));

  return data;
} 