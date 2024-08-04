import { getContext } from '@/utils/context'
import prismadb from '../../lib/prismadb'
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { checkMessageCredits, deductMessageCredit, getMessageCreditCount } from '@/lib/messageCredits';
import { streamText, StreamingTextResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

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

    const lastMessage = messages[messages.length - 1]

    const context = await getContext(lastMessage.content, '', filter, countryOption)

    const englishPrompt = "Here are the context information:\n" +
      "START CONTEXT BLOCK\n" +
      context +
      "\nEND OF CONTEXT BLOCK\n" +
      "Please analyze this case for me as follows:\n\n" +
      "1. Summarize the case concisely.\n" +
      "2. Explain why this case is relevant to my situation in point form. For each point:\n" +
      "   - State the reason for relevance\n" +
      "   - Support your point by citing the exact relevant text from the case\n" +
      "Your response will be rendered using React Markdown. Use the following formatting:\n\n" +
      "- Use standard markdown for headings and lists\n" +
      "- Enclose quotes in triple backticks to render them as distinct blocks\n" +
      "- Use bold for emphasis where appropriate\n\n" +
      "Format your response like this:\n\n" +
      "## Summary\n" +
      "(Your concise summary of the case)\n\n" +
      "## Relevance to Your Situation\n\n" +
      "### 1. First reason for relevance\n" +
      "```\n" +
      "Exact quote from the case\n" +
      "```\n" +
      "### 2. Second reason for relevance\n" +
      "```\n" +
      "Another exact quote from the case\n" +
      "```\n" +
      "(Continue with additional numbered points as needed)";

    const chinesePrompt = "以下是案例的背景資訊（以英文提供）：\n" +
      "開始背景資訊\n" +
      context +
      "\n結束背景資訊\n" +
      "請按照以下方式分析這個案例，並以繁體中文回答：\n\n" +
      "1. 簡潔地總結案例。\n" +
      "2. 以要點形式解釋為什麼這個案例與我的情況相關。對於每個要點：\n" +
      "   - 說明相關性的原因\n" +
      "   - 引用案例中的確切相關文字（保持英文原文）來支持你的觀點\n" +
      "你的回答將使用 React Markdown 呈現。請使用以下格式：\n\n" +
      "- 使用標準 markdown 語法來表示標題和列表\n" +
      "- 使用三個反引號將引用包圍，以便將其呈現為獨特的區塊\n" +
      "- 適當使用粗體來強調\n\n" +
      "請按照以下格式回答（除了引用外，其餘部分請使用繁體中文）：\n\n" +
      "## 摘要\n" +
      "（你對案例的簡潔總結）\n\n" +
      "## 與你情況的相關性\n\n" +
      "### 1. 第一個相關性原因\n" +
      "```\n" +
      "案例中的確切引用（保持英文原文）\n" +
      "```\n" +
      "### 2. 第二個相關性原因\n" +
      "```\n" +
      "案例中的另一個確切引用（保持英文原文）\n" +
      "```\n" +
      "（根據需要繼續添加編號的要點）";

    let initialPrompt = [
      {
        role: 'user',
        content: outputLanguage === "English" ? englishPrompt : chinesePrompt
      }
    ];

    const model = fireworks('accounts/fireworks/models/llama-v3-70b-instruct');

    // new AI SDK
    const result = await streamText({
      model: model,
      system: initialPrompt[0].content,
      messages: messages,
      maxTokens: 1000
    })

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
    })

    return new StreamingTextResponse(stream)

  } catch (e) {
    throw (e)
  }
}