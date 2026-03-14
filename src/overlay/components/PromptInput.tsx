import React, { useRef, useState } from 'react'

interface PromptInputProps {
  onSubmit: (text: string) => void
  onClear: () => void
  isStreaming: boolean
}

export function PromptInput({ onSubmit, onClear, isStreaming }: PromptInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onSubmit(trimmed)
        setValue('')
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setValue('')
      onClear()
      inputRef.current?.blur()
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (⌘↵ to send)"
          className="w-full bg-white/10 text-white placeholder-white/40 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-white/30 border border-white/10 focus:border-white/20 transition-colors"
        />
      </div>

      {isStreaming && (
        <span
          className="inline-block w-2 h-2 rounded-full bg-blue-400 shrink-0"
          style={{ animation: 'pulse 1s ease-in-out infinite' }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  )
}
