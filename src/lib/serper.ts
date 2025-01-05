import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function logToFile(content: string, prefix: string) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${prefix}_${timestamp}.txt`;
    
    // Debug logging
    console.log('🔍 Debug - Current working directory:', process.cwd());
    
    // Use the public directory instead
    const logPath = path.join(process.cwd(), 'public', 'logs');
    console.log('📁 Debug - Log directory path:', logPath);
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logPath)) {
      console.log('📂 Debug - Creating logs directory...');
      fs.mkdirSync(logPath, { recursive: true });
    }
    
    const filepath = path.join(logPath, filename);
    console.log('📝 Debug - Writing to file:', filepath);
    console.log('📄 Debug - Content length:', content.length);
    
    await fs.promises.writeFile(filepath, content, 'utf8');
    console.log(`✅ Successfully logged content to ${filepath}`);
  } catch (err) {
    const error = err as Error;
    console.error('❌ Error writing log file:', error);
    console.error('💡 Debug - Error details:', {
      error: error.message,
      stack: error.stack,
      cwd: process.cwd(),
    });
  }
}

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
    console.log(`📥 Raw HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);

    // First remove all scripts and styles
    $('script, style, link').remove();

    // Try to find the main rulebook content
    // These are specific to HKEX rulebook structure
    let mainContent = $('.book-navigation');  // Try book navigation first
    if (mainContent.length === 0) {
      mainContent = $('.field--type-text-with-summary');  // Try main content field
    }
    if (mainContent.length === 0) {
      mainContent = $('.region-content');  // Try content region
    }
    if (mainContent.length === 0) {
      mainContent = $('#main-content');  // Try main content ID
    }
    if (mainContent.length === 0) {
      mainContent = $('.content-block');  // Fallback to content block
    }

    // If we found specific content, use only that
    if (mainContent.length > 0) {
      // Keep only the content we want
      $('body').empty().append(mainContent);
    }

    // Additional cleanup specific to HKEX rulebook
    $('.book-navigation__title').remove();  // Remove navigation titles
    $('.book-navigation__menu').remove();   // Remove navigation menu
    $('.breadcrumb').remove();              // Remove breadcrumbs
    $('[class*="pager"]').remove();         // Remove pager elements
    
    // Get the text content
    let content = $('body').text();

    // Clean up the text
    content = content
      .replace(/\s+/g, ' ')                 // Replace multiple spaces with single space
      .replace(/\n+/g, '\n')                // Replace multiple newlines with single newline
      .replace(/\t+/g, ' ')                 // Replace tabs with space
      .replace(/\r/g, '')                   // Remove carriage returns
      .replace(/\[.*?\]/g, '')              // Remove square bracket content
      .replace(/\{.*?\}/g, '')              // Remove curly bracket content
      .replace(/\s+([,\.])/g, '$1')         // Remove spaces before punctuation
      .replace(/\s*\n\s*/g, '\n')           // Clean up spaces around newlines
      .replace(/^[\s\n]+|[\s\n]+$/g, '')    // Trim start and end
      .replace(/\n{3,}/g, '\n\n');          // Limit consecutive newlines to 2

    console.log(`✨ Final content length: ${content.length} characters`);
    console.log(`📝 Content preview: ${content.substring(0, 200)}...`);

    return content;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
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