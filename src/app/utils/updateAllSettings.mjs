import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDefaultSettings() {
  // Get all user IDs from UserMessageCredit
  const users = await prisma.userMessageCredit.findMany({
    select: { userId: true }
  })

  // Create default settings for each user
  for (const user of users) {
    await prisma.settings.upsert({
      where: { userId: user.userId },
      update: {}, // No update needed if it exists
      create: {
        userId: user.userId,
        outputLanguage: 'English'
      }
    })
  }

  console.log('Default settings created for all users')
}

createDefaultSettings()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())