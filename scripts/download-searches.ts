const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

interface Search {
  createdAt: Date
  userName: string | null
  userEmail: string | null
  query: string
}

async function downloadSearches() {
  try {
    console.log('Fetching searches from database...')
    const searches = await prisma.search.findMany({
      select: {
        createdAt: true,
        userName: true,
        userEmail: true,
        query: true
      }
    }) as Search[]

    console.log(`Found ${searches.length} searches`)

    const outputPath = path.join(process.cwd(), 'data', 'search-queries.csv')
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'))
    }

    // Create CSV header
    const header = ['Created At', 'User Name', 'User Email', 'Query']
    
    // Convert searches to CSV rows
    const rows = searches.map((search: Search) => [
      search.createdAt.toISOString(),
      search.userName || '',
      search.userEmail || '',
      // Escape quotes in query and wrap in quotes to handle commas
      `"${(search.query || '').replace(/"/g, '""')}"`
    ])

    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map((row: string[]) => row.join(','))
    ].join('\n')

    // Write to file
    fs.writeFileSync(outputPath, csvContent)

    console.log(`Searches saved to ${outputPath}`)
  } catch (error) {
    console.error('Error downloading searches:', error)
  } finally {
    await prisma.$disconnect()
  }
}

downloadSearches() 