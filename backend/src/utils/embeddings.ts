import OpenAI from 'openai'
import { prisma } from '../db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

function chunkText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      const words = current.split(' ')
      current = words.slice(-CHUNK_OVERLAP).join(' ') + ' ' + sentence
    } else {
      current += (current ? ' ' : '') + sentence
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(c => c.length > 20)
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

export async function embedAndStore(documentId: string, businessId: string, text: string): Promise<void> {
  const chunks = chunkText(text)
  console.log(`Processing ${chunks.length} chunks for doc ${documentId}`)

  await prisma.documentChunk.deleteMany({ where: { documentId } })

  const batchSize = 10
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddings = await Promise.all(batch.map(c => generateEmbedding(c)))

    for (let j = 0; j < batch.length; j++) {
      const embedding = embeddings[j]
      const vectorStr = `[${embedding.join(',')}]`

      await prisma.$executeRaw`
        INSERT INTO document_chunks (id, "documentId", "businessId", content, embedding, "chunkIndex", "createdAt")
        VALUES (gen_random_uuid(), ${documentId}, ${businessId}, ${batch[j]}, ${vectorStr}::vector, ${i + j}, NOW())
      `
    }
  }
}

export async function searchSimilarChunks(
  businessId: string,
  query: string,
  limit = 5
): Promise<Array<{ content: string; documentId: string }>> {
  const queryEmbedding = await generateEmbedding(query)
  const vectorStr = `[${queryEmbedding.join(',')}]`

  const results = await prisma.$queryRaw<Array<{ content: string; documentId: string; similarity: number }>>`
    SELECT content, "documentId", 1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM document_chunks
    WHERE "businessId" = ${businessId}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `

  return results.map((r: { content: any; documentId: any }) => ({ content: r.content, documentId: r.documentId }))
}
