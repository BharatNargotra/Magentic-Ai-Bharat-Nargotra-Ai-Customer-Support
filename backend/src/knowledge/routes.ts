import { Hono } from 'hono'
import { prisma } from '../db/client'
import { authMiddleware, JWTPayload } from '../middleware/auth'
import { embedAndStore } from '../utils/embeddings'
import { parseDocument } from '../utils/parser'

const knowledge = new Hono()
knowledge.use('*', authMiddleware)

// List documents
knowledge.get('/', async (c) => {
  const user = c.get('user') as JWTPayload
  const docs = await prisma.document.findMany({
    where: { businessId: user.businessId },
    include: { _count: { select: { chunks: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return c.json(docs)
})

// Upload document
knowledge.post('/upload', async (c) => {
  const user = c.get('user') as JWTPayload

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No file provided' }, 400)

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt|md)$/i)) {
    return c.json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or MD.' }, 400)
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'
  const fileType = ext

  // Create document record
  const doc = await prisma.document.create({
    data: {
      businessId: user.businessId,
      name: file.name,
      fileType,
      fileSize: buffer.length,
      status: 'PROCESSING',
    },
  })

  // Process async
  processDocument(doc.id, user.businessId, buffer, fileType).catch(async (err) => {
    console.error('Document processing failed:', err)
    await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } })
  })

  return c.json(doc, 201)
})

async function processDocument(docId: string, businessId: string, buffer: Buffer, fileType: string) {
  const text = await parseDocument(buffer, fileType)
  if (!text.trim()) throw new Error('Could not extract text from document')

  await embedAndStore(docId, businessId, text)
  await prisma.document.update({ where: { id: docId }, data: { status: 'INDEXED' } })
}

// Delete document
knowledge.delete('/:id', async (c) => {
  const user = c.get('user') as JWTPayload
  const id = c.req.param('id')

  const doc = await prisma.document.findFirst({ where: { id, businessId: user.businessId } })
  if (!doc) return c.json({ error: 'Not found' }, 404)

  await prisma.document.delete({ where: { id } })
  return c.json({ success: true })
})

// Re-index document
knowledge.post('/:id/reindex', async (c) => {
  const user = c.get('user') as JWTPayload
  const id = c.req.param('id')

  const doc = await prisma.document.findFirst({ where: { id, businessId: user.businessId } })
  if (!doc) return c.json({ error: 'Not found' }, 404)

  await prisma.document.update({ where: { id }, data: { status: 'PROCESSING' } })
  await prisma.documentChunk.deleteMany({ where: { documentId: id } })

  return c.json({ message: 'Reindexing started' })
})

// Get document status
knowledge.get('/:id', async (c) => {
  const user = c.get('user') as JWTPayload
  const id = c.req.param('id')

  const doc = await prisma.document.findFirst({
    where: { id, businessId: user.businessId },
    include: { _count: { select: { chunks: true } } },
  })
  if (!doc) return c.json({ error: 'Not found' }, 404)

  return c.json(doc)
})

export default knowledge
