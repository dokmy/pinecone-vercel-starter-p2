# Project Conventions

## AI Models

- **Always use Gemini 3.0 Flash** (`gemini-3-flash-preview`) for all AI features
- Do NOT use Gemini 2.0 or older versions - they are outdated
- Gemini 3.0 Flash rate limits: 1000 RPM, 1M TPM, 10K RPD
- **Use `@google/genai` SDK** (NOT the deprecated `@google/generative-ai`)
- Gemini 3 native thinking mode: use `thinkingConfig: { thinkingLevel: "medium", includeThoughts: true }`
- Thinking levels: "minimal", "low", "medium", "high" (Flash supports all 4)

## Tech Stack

- Next.js with App Router
- Prisma for database (when persistence is needed)
- Pinecone for vector search
- Clerk for authentication
- Tailwind CSS + shadcn/ui for styling

## Code Style

- Use TypeScript
- Use "use client" directive for client components
- API routes go in `/src/app/api/`
- Pages go in `/src/app/(root)/(routes)/`
