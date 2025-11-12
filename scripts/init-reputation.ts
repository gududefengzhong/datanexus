/**
 * Initialize Provider Reputation for all existing users
 * 
 * This script creates ProviderReputation records for all users who don't have one yet.
 * Run this script once to initialize the reputation system for existing providers.
 * 
 * Usage:
 *   npx tsx scripts/init-reputation.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Initializing Provider Reputation...\n')

  // Get all users
  const users = await prisma.user.findMany({
    include: {
      providerReputation: true,
    },
  })

  console.log(`📊 Found ${users.length} users`)

  let created = 0
  let skipped = 0

  for (const user of users) {
    if (user.providerReputation) {
      console.log(`⏭️  Skipping ${user.walletAddress.slice(0, 8)}... (already has reputation)`)
      skipped++
    } else {
      console.log(`✨ Creating reputation for ${user.walletAddress.slice(0, 8)}...`)
      
      await prisma.providerReputation.create({
        data: {
          providerId: user.id,
        },
      })
      
      created++
    }
  }

  console.log('\n✅ Done!')
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total:   ${users.length}`)
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

