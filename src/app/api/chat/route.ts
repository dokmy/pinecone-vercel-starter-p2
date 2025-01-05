import { getContext } from '@/utils/context'
import prismadb from '../../lib/prismadb'
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { checkMessageCredits, deductMessageCredit, getMessageCreditCount } from '@/lib/messageCredits';
import { streamText, StreamingTextResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';
import { OpenAIStream } from 'ai';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Fireworks client as fallback
const fireworks = createOpenAI({
  apiKey: process.env.FIREWORKS_API_KEY ?? '',
  baseURL: 'https://api.fireworks.ai/inference/v1',
});

export async function POST(req: Request) {
  try {
    const {userId} = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", {status: 401})
    }

    const user = await currentUser();
    if (!user || !user.id ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userName = user?.firstName + " " + user?.lastName;
    const userEmail = user?.emailAddresses[0].emailAddress;

    // Fetch user settings to get the language preference
    const userSettings = await prismadb.settings.findUnique({
      where: { userId },
    });

    const outputLanguage = userSettings?.outputLanguage || "English";

    // Check if the user has credits record in the database
    const inMessageCreditsDb = await checkMessageCredits(userId);

    if (!inMessageCreditsDb) {
      return new NextResponse("Not inside credits database", {status: 401})
    } 

    const creditsLeft = await getMessageCreditCount(userId)

    if (creditsLeft ==0 || creditsLeft == false || creditsLeft < 0) {
      return new NextResponse("No more credits. Please upgrade or buy more credits.", {status: 403})
    }

    if (creditsLeft > 0) {
      console.log("Message is permitted. Deduct 1 credit after completion.")
    }

    const { messages, filter, searchResultId, countryOption } = await req.json()

    console.log("\n💬 CHAT STATUS:");
    console.log("Number of messages in chat:", messages.length);
    console.log("Latest message from:", messages[messages.length - 1].role);

    const lastMessage = messages[messages.length - 1]

    const context = await getContext(lastMessage.content, '', filter, countryOption)

    // First LLM response (comprehensive analysis)
    const englishFirstPrompt = "I am analyzing the case with neutral citation " + filter + " in response to the following query:\n\n" +
      "USER QUERY:\n" + lastMessage.content + "\n\n" +
      "Here is the context information from this specific case:\n" +
      "START CASE CONTEXT BLOCK\n" +
      context +
      "\nEND CASE CONTEXT BLOCK\n" +
      "Please analyze this specific case for me as follows:\n\n" +
      "1. Based ONLY on the case context information provided above, summarize THIS SPECIFIC CASE concisely. Your summary must be unique to this case and based solely on the facts presented in the case context block. DO NOT reuse summaries from other cases.\n\n" +
      "2. Explain why this case is relevant to the user's query in point form. For each point:\n" +
      "   - State the reason for relevance to the user's specific query\n" +
      "   - Support your point by citing the exact relevant text from the case\n\n" +
      "3. Based on this specific case, provide a direct answer to the user's query:\n" +
      "   - What insights or guidance does this case provide for the user's situation?\n" +
      "   - What specific principles or findings from this case can be applied?\n" +
      "   - What practical advice can be drawn from this case?\n\n" +
      "Your response will be rendered using React Markdown. Use the following formatting:\n\n" +
      "- Use standard markdown for headings and lists\n" +
      "- Enclose quotes in triple backticks to render them as distinct blocks\n" +
      "- Use bold for emphasis where appropriate\n\n" +
      "Format your response like this:\n\n" +
      "## Summary\n" +
      "(Your concise summary of THIS SPECIFIC case, based only on the case context provided)\n\n" +
      "## Relevance to Your Query\n\n" +
      "### 1. First reason for relevance\n" +
      "```\n" +
      "Exact quote from the case\n" +
      "```\n" +
      "### 2. Second reason for relevance\n" +
      "```\n" +
      "Another exact quote from the case\n" +
      "```\n" +
      "(Continue with additional numbered points as needed)\n\n" +
      "## Answer to Your Query\n" +
      "(Provide a detailed answer to the user's query, using this specific case as a reference and guide. Be practical and specific in your advice.)";

    // Subsequent messages (focused response)
    const englishFollowUpPrompt = "I am continuing our discussion about the case with neutral citation " + filter + ". Here is your query:\n\n" +
      "USER QUERY:\n" + lastMessage.content + "\n\n" +
      "Here is the context information from this case:\n" +
      "START CASE CONTEXT BLOCK\n" +
      context +
      "\nEND CASE CONTEXT BLOCK\n\n" +
      "Please answer the query based on the context information provided above. Use relevant quotes from the case to support your answer.\n\n" +
      "Format your response using markdown:\n" +
      "- Use headings and lists as needed\n" +
      "- Enclose case quotes in triple backticks\n" +
      "- Use bold for emphasis where appropriate";

    // First LLM response in Chinese
    const chineseFirstPrompt = "我正在分析案例編號 " + filter + "，以回應以下查詢：\n\n" +
      "用戶查詢：\n" + lastMessage.content + "\n\n" +
      "以下是這個特定案例的背景資訊（以英文提供）：\n" +
      "開始案例背景資訊\n" +
      context +
      "\n結束案例背景資訊\n" +
      "請按照以下方式分析這個特定案例，並以繁體中文回答：\n\n" +
      "1. 僅根據上述案例背景資訊，簡潔地總結這個特定案例。你的總結必須是針對這個案例的獨特內容，並且只基於背景資訊中呈現的事實。不要重複使用其他案例的總結。\n\n" +
      "2. 以要點形式解釋為什麼這個案例與用戶的查詢相關。對於每個要點：\n" +
      "   - 說明與用戶具體查詢的相關性原因\n" +
      "   - 引用案例中的確切相關文字（保持英文原文）來支持你的觀點\n\n" +
      "3. 根據這個特定案例，直接回答用戶的查詢：\n" +
      "   - 這個案例對用戶的情況提供了什麼見解或指導？\n" +
      "   - 這個案例中有什麼具體原則或結果可以應用？\n" +
      "   - 從這個案例可以得出什麼實用建議？\n\n" +
      "你的回答將使用 React Markdown 呈現。請使用以下格式：\n\n" +
      "- 使用標準 markdown 語法來表示標題和列表\n" +
      "- 使用三個反引號將引用包圍，以便將其呈現為獨特的區塊\n" +
      "- 適當使用粗體來強調\n\n" +
      "請按照以下格式回答（除了引用外，其餘部分請使用繁體中文）：\n\n" +
      "## 摘要\n" +
      "（你對這個特定案例的簡潔總結，僅基於提供的案例背景資訊）\n\n" +
      "## 與你查詢的相關性\n\n" +
      "### 1. 第一個相關性原因\n" +
      "```\n" +
      "案例中的確切引用（保持英文原文）\n" +
      "```\n" +
      "### 2. 第二個相關性原因\n" +
      "```\n" +
      "案例中的另一個確切引用（保持英文原文）\n" +
      "```\n" +
      "（根據需要繼續添加編號的要點）\n\n" +
      "## 回應你的查詢\n" +
      "（根據這個特定案例為參考和指導，詳細回答用戶的查詢。提供實用和具體的建議。）";

    // Subsequent messages in Chinese
    const chineseFollowUpPrompt = "我們正在討論案例編號 " + filter + "。以下是你的查詢：\n\n" +
      "用戶查詢：\n" + lastMessage.content + "\n\n" +
      "以下是這個案例的背景資訊（以英文提供）：\n" +
      "開始案例背景資訊\n" +
      context +
      "\n結束案例背景資訊\n\n" +
      "請根據上述背景資訊回答查詢。引用案例中的相關內容（保持英文原文）來支持你的答案。\n\n" +
      "請使用以下格式（除了引用外，其餘部分請使用繁體中文）：\n" +
      "- 使用標題和列表\n" +
      "- 使用三個反引號包圍案例引用\n" +
      "- 適當使用粗體來強調";

    // Select appropriate prompt based on message count and language
    const selectedPrompt = messages.length === 1 
      ? (outputLanguage === "English" ? englishFirstPrompt : chineseFirstPrompt)
      : (outputLanguage === "English" ? englishFollowUpPrompt : chineseFollowUpPrompt);

    console.log("\n🤖 PROMPT SENT TO LLM:");
    console.log("=".repeat(80));
    console.log(selectedPrompt);
    console.log("=".repeat(80));

    let initialPrompt = [
      {
        role: 'user',
        content: selectedPrompt
      }
    ];

    try {
      // Try OpenAI GPT-4o-mini first
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: "You are a legal assistant analyzing case law. Provide detailed analysis and practical insights."
          },
          {
            role: 'user',
            content: initialPrompt[0].content
          },
          ...messages
        ],
        stream: true,
      });

      const stream = OpenAIStream(response, {
        async onCompletion(completion) {
          console.log("\n🤖 RAW LLM RESPONSE:");
          console.log("=".repeat(80));
          console.log(completion);
          console.log("=".repeat(80));

          await prismadb.message.create({
            data:{
              role: Role.assistant,
              content: completion,
              userId: user.id,
              searchResultId: searchResultId,
              userName: userName,
              userEmail: userEmail
            }
          });
          await deductMessageCredit(userId)
        }
      });

      return new StreamingTextResponse(stream);

    } catch (error) {
      console.log("OpenAI error, falling back to Fireworks:", error);
      
      // Fallback to Fireworks
      const model = fireworks('accounts/fireworks/models/llama-v3-70b-instruct');

      const result = await streamText({
        model: model,
        system: "You are a legal assistant analyzing case law. Provide detailed analysis and practical insights.",
        messages: messages,
        maxTokens: 1000
      });

      const stream = result.toAIStream({
        async onStart()  {
          await prismadb.message.create({
            data:{
              role: Role.user,
              content: lastMessage.content,
              userId: user.id,
              searchResultId: searchResultId,
              userName: userName,
              userEmail: userEmail
            }
          });
        },
        async onCompletion(completion: string) {
          console.log("\n🤖 RAW LLM RESPONSE (Fireworks fallback):");
          console.log("=".repeat(80));
          console.log(completion);
          console.log("=".repeat(80));

          await prismadb.message.create({
            data:{
              role: Role.assistant,
              content: completion,
              userId: user.id,
              searchResultId: searchResultId,
              userName: userName,
              userEmail: userEmail
            }
          });
          await deductMessageCredit(userId)
        }
      });

      return new StreamingTextResponse(stream);
    }

  } catch (e) {
    throw (e)
  }
}