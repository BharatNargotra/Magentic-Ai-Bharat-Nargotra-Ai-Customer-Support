import { Hono } from 'hono'
import { prisma } from '../db/client'
import { authMiddleware, JWTPayload } from '../middleware/auth'

const analytics = new Hono()
analytics.use('*', authMiddleware)

analytics.get('/dashboard', async (c) => {
  const user = c.get('user') as JWTPayload
  const bId = user.businessId

  const [
    totalConversations,
    openTickets,
    resolvedTickets,
    escalatedTickets,
    totalTickets,
    recentConversations,
    ticketsByPriority,
  ] = await Promise.all([
    prisma.conversation.count({ where: { businessId: bId } }),
    prisma.ticket.count({ where: { businessId: bId, status: 'OPEN' } }),
    prisma.ticket.count({ where: { businessId: bId, status: 'RESOLVED' } }),
    prisma.conversation.count({ where: { businessId: bId, status: 'ESCALATED' } }),
    prisma.ticket.count({ where: { businessId: bId } }),
    prisma.conversation.findMany({
      where: { businessId: bId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { messages: true } } },
    }),
    prisma.ticket.groupBy({
      by: ['priority'],
      where: { businessId: bId },
      _count: true,
    }),
  ])

  const resolutionRate = totalConversations > 0
    ? Math.round((resolvedTickets / totalConversations) * 100)
    : 0

  const escalationRate = totalConversations > 0
    ? Math.round((escalatedTickets / totalConversations) * 100)
    : 0

  return c.json({
    overview: {
      totalConversations,
      openTickets,
      resolvedTickets,
      escalatedTickets,
      totalTickets,
      resolutionRate,
      escalationRate,
    },
    recentConversations,
    ticketsByPriority,
  })
})

analytics.get('/conversations', async (c) => {
  const user = c.get('user') as JWTPayload
  const { page = '1', limit = '20', search, status } = c.req.query()

  const where: any = { businessId: user.businessId }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, items] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ])

  return c.json({ items, total })
})

export default analytics
