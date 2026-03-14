import React from 'react'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
}) => {
  return (
    <textarea
      className="w-full min-h-[160px] bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors leading-relaxed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder ?? 'Enter system prompt…'}
      spellCheck={false}
    />
  )
}
