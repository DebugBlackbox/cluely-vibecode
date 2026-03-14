import React, { useCallback, useEffect, useRef, useState } from 'react'
import { OverlayControls } from './components/OverlayControls'
import { PromptInput } from './components/PromptInput'
import { SuggestionCard } from './components/SuggestionCard'
import { DEFAULT_PREFERENCES } from '../shared/constants'

export function Overlay() {
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [lastPrompt, setLastPrompt] = useState('')
  const [autoDismissMs] = useState(DEFAULT_PREFERENCES.autoDismissMs)

  const api = window.electronAPI

  useEffect(() => {
    const handleToken = (token: string) => {
      setStreamedText((prev) => prev + token)
      setIsStreaming(true)
      setError(null)
    }

    const handleDone = () => {
      setIsStreaming(false)
    }

    const handleError = (msg: string) => {
      setError(msg)
      setIsStreaming(false)
    }

    const handleClear = () => {
      setStreamedText('')
      setIsStreaming(false)
      setError(null)
    }

    api.onStreamToken(handleToken)
    api.onStreamDone(handleDone)
    api.onStreamError(handleError)
    api.onStreamClear(handleClear)

    return () => {
      api.removeAllListeners('stream:token')
      api.removeAllListeners('stream:done')
      api.removeAllListeners('stream:error')
      api.removeAllListeners('stream:clear')
    }
  }, [api])

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      setLastPrompt(text)
      setStreamedText('')
      setError(null)
      setIsStreaming(true)
      try {
        await api.trigger(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsStreaming(false)
      }
    },
    [api]
  )

  const handleClear = useCallback(() => {
    setStreamedText('')
    setError(null)
    setIsStreaming(false)
  }, [])

  const handleDismiss = useCallback(() => {
    setStreamedText('')
    setError(null)
    setIsStreaming(false)
    setIsPinned(false)
  }, [])

  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      handleSubmit(lastPrompt)
    }
  }, [lastPrompt, handleSubmit])

  const handleMouseEnter = useCallback(() => {
    api.overlayMouseEnter()
  }, [api])

  const handleMouseLeave = useCallback(() => {
    api.overlayMouseLeave()
  }, [api])

  const showCard = streamedText.length > 0 || isStreaming || error !== null

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: 480,
        background: 'rgba(0, 0, 0, 0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <OverlayControls />

      {showCard && (
        <SuggestionCard
          text={streamedText}
          isStreaming={isStreaming}
          error={error}
          isPinned={isPinned}
          onPinToggle={() => setIsPinned((p) => !p)}
          onDismiss={handleDismiss}
          onRetry={handleRetry}
          autoDismissMs={autoDismissMs}
        />
      )}

      <PromptInput
        onSubmit={handleSubmit}
        onClear={handleClear}
        isStreaming={isStreaming}
      />
    </div>
  )
}
