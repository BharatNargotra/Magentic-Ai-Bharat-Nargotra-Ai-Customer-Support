import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const businessId = uuid()
  const business = await prisma.business.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      id: businessId,
      name: 'Demo Company',
      slug: 'demo-company',
      plan: 'pro',
    },
  })

  const passwordHash = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { businessId_email: { businessId: business.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      businessId: business.id,
      email: 'admin@demo.com',
      passwordHash,
      name: 'Admin User',
      role: 'OWNER',
    },
  })

  await prisma.botConfig.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      botName: 'DemoBot',
      welcomeMessage: 'Hi there! I\'m DemoBot. How can I help you today?',
      personality: 'friendly',
      escalationRules: [
        { keyword: 'refund', priority: 'HIGH' },
        { keyword: 'legal', priority: 'URGENT' },
        { keyword: 'angry', priority: 'HIGH' },
        { keyword: 'human', priority: 'HIGH' },
      ],
      suggestedQs: ['Track my order', 'Pricing info', 'Refund policy', 'Contact support'],
    },
  })

  await prisma.apiKey.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      key: `sk_demo_${uuid().replace(/-/g, '')}`,
    },
  })

  console.log('✅ Seed complete!')
  console.log(`   Business: ${business.name} (${business.slug})`)
  console.log(`   Admin: admin@demo.com / admin123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
