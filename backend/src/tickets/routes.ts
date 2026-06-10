import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db/client'
import { authMiddleware, JWTPayload } from '../middleware/auth'

const tickets = new Hono<{ Variables: { user: JWTPayload } }>()
tickets.use('*', authMiddleware)

// List tickets with filters
tickets.get('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const { status, priority, page = '1', limit = '20', search } = c.req.query()

  const where: any = { businessId: user.businessId }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, items] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true, email: true } }, conversation: { select: { id: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ])

  return c.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
})

// Get ticket
tickets.get('/:id', async (c) => {
  const user = c.get('user') as JWTPayload
  const ticket = await prisma.ticket.findFirst({
    where: { id: c.req.param('id'), businessId: user.businessId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
    },
  })
  if (!ticket) return c.json({ error: 'Not found' }, 404)
  return c.json(ticket)
})

// Update ticket
tickets.patch('/:id', async (c) => {
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const schema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().optional().nullable(),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const ticket = await prisma.ticket.findFirst({
    where: { id: c.req.param('id'), businessId: user.businessId },
  })
  if (!ticket) return c.json({ error: 'Not found' }, 404)

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: parsed.data,
  })

  // Update conversation status if ticket resolved
  if (parsed.data.status === 'RESOLVED' && ticket.conversationId) {
    await prisma.conversation.update({
      where: { id: ticket.conversationId },
      data: { status: 'RESOLVED' },
    })
  }

  return c.json(updated)
})

// Create ticket manually
tickets.post('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  const schema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    subject: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const ticket = await prisma.ticket.create({
    data: { businessId: user.businessId, ...parsed.data },
  })
  return c.json(ticket, 201)
})

export default tickets
