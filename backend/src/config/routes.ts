import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db/client'
import { authMiddleware, JWTPayload } from '../middleware/auth'

const config = new Hono()
config.use('*', authMiddleware)

config.get('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const botConfig = await prisma.botConfig.findUnique({
    where: { businessId: user.businessId },
  })
  return c.json(botConfig)
})

config.put('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const schema = z.object({
    botName: z.string().min(1).optional(),
    welcomeMessage: z.string().min(1).optional(),
    personality: z.enum(['professional', 'friendly', 'technical']).optional(),
    escalationRules: z.array(z.object({
      keyword: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    })).optional(),
    suggestedQs: z.array(z.string()).optional(),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const updated = await prisma.botConfig.upsert({
    where: { businessId: user.businessId },
    update: parsed.data,
    create: { businessId: user.businessId, ...parsed.data },
  })

  return c.json(updated)
})

config.get('/api-key', async (c) => {
  const user = c.get('user') as JWTPayload
  const apiKey = await prisma.apiKey.findUnique({
    where: { businessId: user.businessId },
  })
  return c.json(apiKey)
})

export default config
