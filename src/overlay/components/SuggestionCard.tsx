import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SuggestionCardProps {
  text: string
  isStreaming: boolean
  error: string | null
  isPinned: boolean
  onPinToggle: () => void
  onDismiss: () => void
  onRetry: () => void
  autoDismissMs: number
}

export function SuggestionCard({
  text,
  isStreaming,
  error,
  isPinned,
  onPinToggle,
  onDismiss,
  onRetry,
  autoDismissMs,
}: SuggestionCardProps) {
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }

    if (!isStreaming && autoDismissMs > 0 && !isPinned && text && !error) {
      dismissTimerRef.current = setTimeout(() => {
        onDismiss()
      }, autoDismissMs)
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
      }
    }
  }, [isStreaming, autoDismissMs, isPinned, text, error, onDismiss])

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {
        // Clipboard access may be restricted — silently ignore
      })
    }
  }

  if (error) {
    return (
      <div className="mx-3 mb-2 rounded-lg p-3 bg-red-900/60 border border-red-500/40">
        <div className="flex items-start justify-between gap-2">
          <p className="text-red-300 text-sm flex-1">{error}</p>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onRetry}
              className="text-xs text-red-300 hover:text-white px-2 py-0.5 rounded border border-red-500/40 hover:border-red-400/60 transition-colors"
              title="Retry"
            >
              Retry
            </button>
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-white transition-colors px-1"
              title="Dismiss"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-2 rounded-lg border border-white/10 overflow-hidden">
      {/* Controls row */}
      <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-white/10 bg-white/5">
        {isStreaming && (
          <span className="text-xs text-blue-400 mr-auto animate-pulse">
            Thinking…
          </span>
        )}
        <button
          onClick={onPinToggle}
          className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
            isPinned
              ? 'text-yellow-300 bg-yellow-300/15 hover:bg-yellow-300/25'
              : 'text-white/40 hover:text-white/80 hover:bg-white/10'
          }`}
          title={isPinned ? 'Unpin' : 'Pin'}
          aria-label={isPinned ? 'Unpin' : 'Pin'}
        >
          📌
        </button>
        <button
          onClick={handleCopy}
          className="text-xs text-white/40 hover:text-white/80 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          title="Copy to clipboard"
          aria-label="Copy"
        >
          Copy
        </button>
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white/80 text-base leading-none px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          title="Dismiss"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto px-3 py-2 text-white text-sm"
        style={{ maxHeight: 400 }}
      >
        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
        {isStreaming && (
          <span
            className="inline-block w-1.5 h-4 bg-white/70 ml-0.5 align-middle"
            style={{ animation: 'blink 1s step-end infinite' }}
          />
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .prose-invert p { margin: 0.25rem 0; }
        .prose-invert ul { padding-left: 1.25rem; margin: 0.25rem 0; }
        .prose-invert li { margin: 0.1rem 0; }
        .prose-invert code {
          background: rgba(255,255,255,0.12);
          border-radius: 0.2rem;
          padding: 0.1rem 0.3rem;
          font-size: 0.8em;
        }
        .prose-invert pre {
          background: rgba(0,0,0,0.4);
          border-radius: 0.4rem;
          padding: 0.5rem 0.75rem;
          overflow-x: auto;
          margin: 0.4rem 0;
        }
        .prose-invert pre code {
          background: transparent;
          padding: 0;
        }
        .prose-invert blockquote {
          border-left: 3px solid rgba(255,255,255,0.3);
          padding-left: 0.75rem;
          color: rgba(255,255,255,0.7);
          margin: 0.4rem 0;
        }
      `}</style>
    </div>
  )
}
