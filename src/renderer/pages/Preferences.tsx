import React, { useEffect, useState, useRef } from 'react'
import { useUIStore } from '../store/uiStore'
import type { Settings } from '@shared/types'
import { DEFAULT_PREFERENCES } from '@shared/constants'

type OverlayPosition = { x: number; y: number } | null

interface ExtendedSettings extends Settings {
  overlayPosition?: OverlayPosition
}

const AUTO_DISMISS_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '60 seconds', value: 60000 },
]

export const Preferences: React.FC = () => {
  const { settings, updateSettings } = useUIStore()

  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [triggerShortcut, setTriggerShortcut] = useState(DEFAULT_PREFERENCES.triggerShortcut)
  const [toggleShortcut, setToggleShortcut] = useState(DEFAULT_PREFERENCES.toggleShortcut)
  const [autoDismissMs, setAutoDismissMs] = useState<number>(DEFAULT_PREFERENCES.autoDismissMs)
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_PREFERENCES.overlayOpacity)
  const [capturingFor, setCapturingFor] = useState<'trigger' | 'toggle' | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const triggerRef = useRef<HTMLButtonElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Populate from stored settings
  useEffect(() => {
    if (!settings) return
    setApiKey(settings.geminiApiKey ?? '')
    setTriggerShortcut(settings.preferences?.triggerShortcut ?? DEFAULT_PREFERENCES.triggerShortcut)
    setToggleShortcut(settings.preferences?.toggleShortcut ?? DEFAULT_PREFERENCES.toggleShortcut)
    setAutoDismissMs(settings.preferences?.autoDismissMs ?? DEFAULT_PREFERENCES.autoDismissMs)
    setOverlayOpacity(settings.preferences?.overlayOpacity ?? DEFAULT_PREFERENCES.overlayOpacity)
  }, [settings])

  // Key capture logic
  useEffect(() => {
    if (!capturingFor) return

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const modifiers: string[] = []
      if (e.ctrlKey || e.metaKey) modifiers.push('CommandOrControl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')

      const key = e.key
      // Ignore bare modifier presses
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) return

      const normalizedKey =
        key === 'Enter'
          ? 'Return'
          : key === ' '
          ? 'Space'
          : key.length === 1
          ? key.toUpperCase()
          : key

      const accelerator = [...modifiers, normalizedKey].join('+')

      if (capturingFor === 'trigger') setTriggerShortcut(accelerator)
      else setToggleShortcut(accelerator)

      setCapturingFor(null)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [capturingFor])

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const patch: Partial<ExtendedSettings> = {
        geminiApiKey: apiKey,
        preferences: {
          triggerShortcut,
          toggleShortcut,
          autoDismissMs,
          overlayOpacity,
        },
      }
      await window.electronAPI.saveSettings(patch)
      updateSettings(patch)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleResetPosition = async () => {
    try {
      await window.electronAPI.saveSettings({ overlayPosition: null } as Partial<ExtendedSettings>)
    } catch (err) {
      console.error('Failed to reset overlay position', err)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-white">Preferences</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure API keys, shortcuts, and display options</p>
      </div>

      {/* API Key */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">API</h2>
        <div className="space-y-1.5">
          <label className="block text-sm text-gray-300">Gemini API Key</label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza…"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 text-sm transition-colors"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Shortcuts</h2>

        <div className="space-y-3">
          {/* Trigger shortcut */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-gray-300">Trigger AI</p>
              <p className="text-xs text-gray-500">Capture screenshot and query AI</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`
                  px-3 py-1.5 rounded-md text-xs font-mono border min-w-[160px] text-center
                  ${capturingFor === 'trigger'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 animate-pulse'
                    : 'bg-gray-800 border-gray-600 text-gray-300'
                  }
                `}
              >
                {capturingFor === 'trigger' ? 'Press keys…' : triggerShortcut}
              </span>
              <button
                ref={triggerRef}
                onClick={() => setCapturingFor(capturingFor === 'trigger' ? null : 'trigger')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs text-gray-300 transition-colors whitespace-nowrap"
              >
                {capturingFor === 'trigger' ? 'Cancel' : 'Change'}
              </button>
            </div>
          </div>

          {/* Toggle shortcut */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-gray-300">Toggle Overlay</p>
              <p className="text-xs text-gray-500">Show/hide the overlay window</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`
                  px-3 py-1.5 rounded-md text-xs font-mono border min-w-[160px] text-center
                  ${capturingFor === 'toggle'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 animate-pulse'
                    : 'bg-gray-800 border-gray-600 text-gray-300'
                  }
                `}
              >
                {capturingFor === 'toggle' ? 'Press keys…' : toggleShortcut}
              </span>
              <button
                ref={toggleRef}
                onClick={() => setCapturingFor(capturingFor === 'toggle' ? null : 'toggle')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs text-gray-300 transition-colors whitespace-nowrap"
              >
                {capturingFor === 'toggle' ? 'Cancel' : 'Change'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay behaviour */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Overlay</h2>

        {/* Auto-dismiss */}
        <div className="space-y-1.5">
          <label className="block text-sm text-gray-300">Auto-dismiss after</label>
          <select
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={autoDismissMs}
            onChange={(e) => setAutoDismissMs(Number(e.target.value))}
          >
            {AUTO_DISMISS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Overlay Opacity</label>
            <span className="text-xs font-mono text-gray-400">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Reset position */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Overlay Position</p>
            <p className="text-xs text-gray-500">Move the overlay back to its default position</p>
          </div>
          <button
            onClick={handleResetPosition}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-sm text-gray-300 transition-colors whitespace-nowrap"
          >
            Reset Position
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`
            w-full py-2.5 rounded-lg text-sm font-medium transition-colors
            ${saveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : saveStatus === 'error'
              ? 'bg-red-600 text-white'
              : saveStatus === 'saving'
              ? 'bg-blue-700 text-blue-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {saveStatus === 'saving'
            ? 'Saving…'
            : saveStatus === 'saved'
            ? 'Saved!'
            : saveStatus === 'error'
            ? 'Error saving'
            : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
