import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Mock electron-store at top level (hoisted)
vi.mock('electron-store', () => {
  const storeData = new Map<string, any>()
  return {
    default: class MockStore {
      defaults: any = { parsedFileCache: {} }
      constructor(opts?: any) {
        if (opts?.defaults) Object.assign(this.defaults, opts.defaults)
      }
      get(key: string) { return storeData.has(key) ? storeData.get(key) : this.defaults[key] }
      set(key: string, val: any) { storeData.set(key, val) }
    }
  }
})

vi.mock('electron', () => import('../__mocks__/electron'))

function writeTempFile(content: string, ext: string): string {
  const filePath = path.join(os.tmpdir(), `fileParser-test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

describe('fileParser', () => {
  const fixturesDir = path.resolve('./fixtures')
  const tempFiles: string[] = []

  afterEach(() => {
    // Clean up temp files
    for (const f of tempFiles) {
      try { fs.unlinkSync(f) } catch { /* ignore */ }
    }
    tempFiles.length = 0
  })

  beforeEach(() => {
    vi.resetModules()
  })

  it('parses sample.txt correctly', async () => {
    const { parseFile } = await import('../../src/main/files/fileParser')
    const result = await parseFile(path.join(fixturesDir, 'sample.txt'))

    expect(result.filename).toBe('sample.txt')
    expect(result.content).toContain('sample text file')
    expect(typeof result.content).toBe('string')
  })

  it('truncates content longer than 8000 chars', async () => {
    const longContent = 'x'.repeat(10000)
    const filePath = writeTempFile(longContent, '.txt')
    tempFiles.push(filePath)

    const { parseFile } = await import('../../src/main/files/fileParser')
    const result = await parseFile(filePath)

    expect(result.content.length).toBeLessThanOrEqual(8000)
  })

  it('strips excess whitespace (collapses multiple newlines)', async () => {
    const contentWithExtraNewlines = 'line1\n\n\n\n\nline2\n\n\nline3'
    const filePath = writeTempFile(contentWithExtraNewlines, '.txt')
    tempFiles.push(filePath)

    const { parseFile } = await import('../../src/main/files/fileParser')
    const result = await parseFile(filePath)

    expect(result.content).not.toMatch(/\n{3,}/)
    expect(result.content).toContain('line1')
    expect(result.content).toContain('line2')
    expect(result.content).toContain('line3')
  })

  it('throws UnsupportedFileTypeError for .xlsx files', async () => {
    const { parseFile } = await import('../../src/main/files/fileParser')
    const err = await parseFile('/fake/path/file.xlsx').catch((e) => e)
    expect(err.name).toBe('UnsupportedFileTypeError')
    expect(err.message).toMatch(/\.xlsx/)
  })

  it('returns cached result on second call for same file (parse only runs once)', async () => {
    // The cache key is the file hash. On cache hit, parsing is skipped.
    // We verify by mocking pdf-parse and ensuring it's called at most once.
    const pdfParseMock = vi.fn().mockResolvedValue({ text: 'parsed pdf content' })
    vi.doMock('pdf-parse', () => ({ default: pdfParseMock }))

    const { parseFile } = await import('../../src/main/files/fileParser')

    const content = Buffer.from('%PDF-1.4 fake pdf content')
    const filePath = writeTempFile(content.toString('utf-8'), '.pdf')
    tempFiles.push(filePath)

    // Write real binary content to the file so readFileSync returns it
    fs.writeFileSync(filePath, content)

    const result1 = await parseFile(filePath)
    const result2 = await parseFile(filePath)

    expect(result1.content).toBe(result2.content)
    // pdf-parse should only have been called once (second call uses cache)
    expect(pdfParseMock).toHaveBeenCalledTimes(1)
  })
})
