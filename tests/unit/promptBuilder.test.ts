import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMessages } from '../../src/main/ai/promptBuilder'
import { DEFAULT_SYSTEM_PROMPT } from '../../src/shared/constants'

describe('promptBuilder', () => {
  const fakeScreenshot = 'base64screenshotdata'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses default system prompt when systemPrompt is empty', () => {
    const messages = buildMessages({
      systemPrompt: '',
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).toContain(DEFAULT_SYSTEM_PROMPT)
  })

  it('uses custom systemPrompt when provided', () => {
    const customPrompt = 'You are a helpful coding assistant.'
    const messages = buildMessages({
      systemPrompt: customPrompt,
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).toContain(customPrompt)
    expect(textPart.text).not.toContain(DEFAULT_SYSTEM_PROMPT)
  })

  it('omits [CONTEXT FILES] section when fileContexts is empty', () => {
    const messages = buildMessages({
      systemPrompt: 'Test prompt',
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).not.toContain('[CONTEXT FILES]')
  })

  it('includes files in [CONTEXT FILES] section, truncated to 4000 chars', () => {
    const longContent = 'a'.repeat(5000)
    const messages = buildMessages({
      systemPrompt: '',
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [{ filename: 'test.txt', content: longContent }],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).toContain('[CONTEXT FILES]')
    expect(textPart.text).toContain('test.txt')
    // Content should be truncated to 4000 chars
    const contentInMessage = textPart.text.split('test.txt')[1]
    expect(contentInMessage.length).toBeLessThan(4100)
  })

  it('omits [USER PROMPT] section when userPrompt is empty', () => {
    const messages = buildMessages({
      systemPrompt: '',
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).not.toContain('[USER PROMPT]')
  })

  it('includes [USER PROMPT] section when userPrompt is provided', () => {
    const messages = buildMessages({
      systemPrompt: '',
      userPrompt: 'What is on my screen?',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).toContain('[USER PROMPT]')
    expect(textPart.text).toContain('What is on my screen?')
  })

  it('includes screenshot as inlineData vision part, not as text', () => {
    const messages = buildMessages({
      systemPrompt: '',
      userPrompt: '',
      screenshotBase64: fakeScreenshot,
      fileContexts: [],
    })

    const inlinePart = messages[0].parts.find((p: any) => 'inlineData' in p) as any
    expect(inlinePart).toBeTruthy()
    expect(inlinePart.inlineData.mimeType).toBe('image/png')
    expect(inlinePart.inlineData.data).toBe(fakeScreenshot)

    // Screenshot data should NOT be in any text part
    const textPart = messages[0].parts.find((p: any) => 'text' in p) as any
    expect(textPart.text).not.toContain(fakeScreenshot)
  })

  it('logs warning when total char estimate exceeds 40000', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // screenshotBase64 + instructionText must exceed 40000
    // Use a very large screenshot to trigger the threshold
    const bigScreenshot = 'A'.repeat(41000)

    buildMessages({
      systemPrompt: '',
      userPrompt: '',
      screenshotBase64: bigScreenshot,
      fileContexts: [],
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/exceed/i))
    warnSpy.mockRestore()
  })
})
