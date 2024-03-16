import { getLegisText } from "./getLegisText";

export async function buildLegisContext(paths: string[]): Promise<any[]> {
    console.log("[buildLegisContext.ts] I am called. Here is the paths: " + paths);

    const context: any[] = [];
    let totalWords = 0;
  
    for (const path of paths) {
      try {
        const legisText = await getLegisText(path);
  
        const { cap, abbr, title, subpath, textContent, cap_number, legis_url } = legisText;
  
        const newObj = {
          cap_number,
          legis_url,
          path,
          cap,
          abbr,
          title,
          subpath,
          textContent,
        };
  
        const wordCount = textContent.trim().split(/\s+/).length;
        totalWords += wordCount;
  
        context.push(newObj);
  
        if (totalWords > 20000) {
          break;
        }
      } catch (error) {
        console.error(`Error extracting data for path: ${path}`, error);
      }
    }
  
    // console.log("[buildLegisContext.ts] context: ", context);
    return context;
  }