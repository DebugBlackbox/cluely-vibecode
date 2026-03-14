import type { GeminiMessage, GeminiPart, FileContext } from '../../shared/types'
import {
  DEFAULT_SYSTEM_PROMPT,
  MAX_FILE_PROMPT_CHARS,
  TOTAL_CHAR_WARN_THRESHOLD,
} from '../../shared/constants'

export function buildMessages(params: {
  systemPrompt: string
  userPrompt: string
  screenshotBase64: string
  fileContexts: FileContext[]
}): GeminiMessage[] {
  const { systemPrompt, userPrompt, screenshotBase64, fileContexts } = params

  const resolvedSystemPrompt = systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT

  const parts: GeminiPart[] = []

  // Part 1: system instruction text
  let instructionText = resolvedSystemPrompt

  // Part 2: file context section
  if (fileContexts.length > 0) {
    instructionText += '\n\n[CONTEXT FILES]\n'
    for (const fc of fileContexts) {
      const truncated =
        fc.content.length > MAX_FILE_PROMPT_CHARS
          ? fc.content.slice(0, MAX_FILE_PROMPT_CHARS)
          : fc.content
      instructionText += `Filename: ${fc.filename}\n${truncated}\n---\n`
    }
  }

  // Part 3: user prompt section
  if (userPrompt.trim().length > 0) {
    instructionText += `\n[USER PROMPT]\n${userPrompt.trim()}`
  }

  parts.push({ text: instructionText })

  // Part 4: screenshot as vision inline data
  parts.push({
    inlineData: {
      mimeType: 'image/png',
      data: screenshotBase64,
    },
  })

  // Warn if total estimated character count exceeds threshold
  const totalChars =
    instructionText.length + screenshotBase64.length
  if (totalChars > TOTAL_CHAR_WARN_THRESHOLD) {
    console.warn(
      `promptBuilder: estimated character count (${totalChars}) exceeds warning threshold (${TOTAL_CHAR_WARN_THRESHOLD})`
    )
  }

  const message: GeminiMessage = {
    role: 'user',
    parts,
  }

  return [message]
}
