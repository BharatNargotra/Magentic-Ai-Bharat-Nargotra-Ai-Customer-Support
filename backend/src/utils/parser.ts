import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export async function parseDocument(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'pdf': {
      const data = await pdf(buffer)
      return data.text
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case 'txt':
    case 'md':
    case 'markdown': {
      return buffer.toString('utf-8')
    }
    default:
      return buffer.toString('utf-8')
  }
}
