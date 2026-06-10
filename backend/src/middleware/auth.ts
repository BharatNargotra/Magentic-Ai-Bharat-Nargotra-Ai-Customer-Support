import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'

export interface JWTPayload {
  userId: string
  businessId: string
  role: string
}

type AuthEnv = {
  Variables: {
    user: JWTPayload
  }
}

type ApiKeyEnv = {
  Variables: {
    businessId: string
    business: any
  }
}

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export async function apiKeyMiddleware(c: Context<ApiKeyEnv>, next: Next) {
  const apiKey = c.req.header('X-API-Key') || c.req.query('apiKey')
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401)
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { business: true },
  })

  if (!key) {
    return c.json({ error: 'Invalid API key' }, 401)
  }

  c.set('businessId', key.businessId)
  c.set('business', key.business)
  await next()
}

export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get('user') as JWTPayload
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}
