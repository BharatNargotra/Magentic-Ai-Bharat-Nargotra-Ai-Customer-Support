import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db/client'
import { v4 as uuid } from 'uuid'

const auth = new Hono()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  slug: z.string(),
})

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { name, email, password, businessName } = parsed.data
  const slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uuid().slice(0, 6)

  const existing = await prisma.business.findUnique({ where: { slug } })
  if (existing) return c.json({ error: 'Business already exists' }, 409)

  const passwordHash = await bcrypt.hash(password, 10)

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
      users: {
        create: { email, passwordHash, name, role: 'OWNER' },
      },
      botConfig: {
        create: {
          botName: `${businessName} Assistant`,
          welcomeMessage: `Hi! I'm the ${businessName} assistant. How can I help?`,
        },
      },
      apiKey: {
        create: { key: `sk_live_${uuid().replace(/-/g, '')}` },
      },
    },
    include: { users: true, apiKey: true },
  })

  const user = business.users[0]
  const token = jwt.sign(
    { userId: user.id, businessId: business.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    business: { id: business.id, name: business.name, slug: business.slug },
    apiKey: business.apiKey?.key,
  })
})

auth.post('/login', async (c) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { email, password, slug } = parsed.data

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { users: { where: { email } } },
  })

  if (!business || business.users.length === 0) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const user = business.users[0]
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const token = jwt.sign(
    { userId: user.id, businessId: business.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    business: { id: business.id, name: business.name, slug: business.slug },
  })
})

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { business: true },
    })
    if (!user) return c.json({ error: 'Not found' }, 404)

    return c.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: user.business.id, name: user.business.name, slug: user.business.slug },
    })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth
