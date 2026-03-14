import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import type { FileContext } from '../../shared/types'
import { UnsupportedFileTypeError } from '../../shared/types'
import { MAX_FILE_CHARS } from '../../shared/constants'
import { getCachedParsedFile, setCachedParsedFile } from '../store/persistentStore'

function collapseWhitespace(text: string): string {
  // Collapse 3+ consecutive newlines to 2
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars)
}

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function parseFile(filePath: string): Promise<FileContext> {
  const ext = path.extname(filePath).toLowerCase()
  const filename = path.basename(filePath)

  // Validate extension before reading (avoids ENOENT for unsupported types)
  const supported = ['.pdf', '.docx', '.txt', '.md']
  if (!supported.includes(ext)) {
    throw new UnsupportedFileTypeError(ext)
  }

  const buffer = fs.readFileSync(filePath)
  const hash = hashBuffer(buffer)

  // Check cache first
  const cached = getCachedParsedFile(hash)
  if (cached !== undefined) {
    return { filename, content: cached }
  }

  let rawText: string

  switch (ext) {
    case '.pdf': {
      const data = await pdfParse(buffer)
      rawText = data.text
      break
    }

    case '.docx': {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
      break
    }

    case '.txt':
    case '.md': {
      rawText = buffer.toString('utf-8')
      break
    }

    default:
      throw new UnsupportedFileTypeError(ext)
  }

  const cleaned = collapseWhitespace(rawText)
  const content = truncate(cleaned, MAX_FILE_CHARS)

  // Store in cache
  setCachedParsedFile(hash, content)

  return { filename, content }
}
