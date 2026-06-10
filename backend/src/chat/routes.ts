import { Hono } from 'hono'
import OpenAI from 'openai'
import { prisma } from '../db/client'
import { apiKeyMiddleware } from '../middleware/auth'
import { searchSimilarChunks } from '../utils/embeddings'
import { detectEscalation } from '../utils/escalation'

const chat = new Hono<{ Variables: Variables }>()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type Variables = {
  businessId: string
  user?: any
}
// Public chat endpoint (used by widget)
chat.post('/', apiKeyMiddleware, async (c) => {
  const businessId = c.get('businessId') as string
  const body = await c.req.json()

  const { message, conversationId, customerName, customerEmail } = body
  if (!message?.trim()) return c.json({ error: 'Message required' }, 400)

  // Get or create conversation
  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, businessId } })
    : null

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { businessId, customerName, customerEmail, status: 'OPEN' },
    })
  }

  // Get bot config
  const botConfig = await prisma.botConfig.findUnique({ where: { businessId } })

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  // Save user message
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: message },
  })

  // RAG: retrieve relevant chunks
  const chunks = await searchSimilarChunks(businessId, message).catch(() => [])
  const context = chunks.length > 0
    ? `\n\nRelevant knowledge base context:\n${chunks.map(c => c.content).join('\n\n---\n\n')}`
    : ''

  // Build system prompt
  const personality = botConfig?.personality || 'professional'
  const personalityGuide = ({
    professional: 'Be concise, clear, and professional.',
    friendly: 'Be warm, approachable, and encouraging.',
    technical: 'Be precise, technical, and detailed.',
  } as any)[personality] || 'Be helpful and professional.'

  const systemPrompt = `You are ${botConfig?.botName || 'SupportBot'}, a customer support assistant.
${personalityGuide}
Answer questions based on the knowledge base context provided. If you cannot answer from the context, say so honestly and offer to create a support ticket.
Do not make up information. Format responses clearly using markdown when appropriate.
${context}`

  // Build messages for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...history.map((m: any) => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  const aiMessage = response.choices[0]?.message?.content || ''

  // Save AI response
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'ASSISTANT', content: aiMessage },
  })

  // Check for escalation
  const escalationRules = (botConfig?.escalationRules as any[]) || []
  const escalation = detectEscalation(message + ' ' + aiMessage, escalationRules)

  let ticket = null
  if (escalation.shouldEscalate && conversation.status !== 'ESCALATED') {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'ESCALATED' },
    })

    ticket = await prisma.ticket.create({
      data: {
        businessId,
        conversationId: conversation.id,
        customerName: customerName || 'Unknown',
        customerEmail: customerEmail || '',
        subject: `Escalated: ${message.slice(0, 80)}`,
        description: message,
        priority: escalation.priority as any,
        status: 'OPEN',
      },
    })
  }

  return c.json({
    message: aiMessage,
    conversationId: conversation.id,
    escalated: escalation.shouldEscalate,
    ticket,
  })
})

// Get conversation history (admin endpoint - no API key needed, uses JWT auth)
chat.get('/:conversationId', async (c) => {
  const conversationId = c.req.param('conversationId')

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!conversation) return c.json({ error: 'Not found' }, 404)
  return c.json(conversation)
})

export default chat
