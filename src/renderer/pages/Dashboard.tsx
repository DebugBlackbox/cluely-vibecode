import React, { useEffect, useState } from 'react'
import { useUIStore } from '../store/uiStore'
import { PromptEditor } from '../components/PromptEditor'
import { StatusIndicator } from '../components/StatusIndicator'
import type { UploadedFile } from '@shared/types'

export const Dashboard: React.FC = () => {
  const { settings, updateSettings, lastTriggerTime, lastResponsePreview } = useUIStore()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [promptDraft, setPromptDraft] = useState(settings?.systemPrompt ?? '')

  // Keep draft in sync when settings first load
  useEffect(() => {
    if (settings?.systemPrompt !== undefined) {
      setPromptDraft(settings.systemPrompt)
    }
  }, [settings?.systemPrompt])

  // Load uploaded files list
  useEffect(() => {
    window.electronAPI.getFiles().then(setFiles).catch(console.error)
  }, [])

  const handlePromptBlur = async () => {
    if (!settings) return
    try {
      await window.electronAPI.saveSettings({ systemPrompt: promptDraft })
      updateSettings({ systemPrompt: promptDraft })
    } catch (err) {
      console.error('Failed to save system prompt', err)
    }
  }

  const handleRemoveFile = async (hash: string) => {
    try {
      await window.electronAPI.removeFile(hash)
      setFiles((prev) => prev.filter((f) => f.hash !== hash))
    } catch (err) {
      console.error('Failed to remove file', err)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure your AI assistant and manage context
          </p>
        </div>
        <StatusIndicator />
      </div>

      {/* Last activity */}
      {lastTriggerTime && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
              Last AI Response
            </span>
            <span className="ml-auto text-xs text-gray-500">{lastTriggerTime}</span>
          </div>
          {lastResponsePreview && (
            <p className="text-sm text-gray-300 leading-relaxed pl-4 border-l-2 border-gray-600">
              {lastResponsePreview}
            </p>
          )}
        </div>
      )}

      {/* System prompt */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          System Prompt
        </label>
        <p className="text-xs text-gray-500">
          This instruction is sent with every AI request. Changes are saved on blur.
        </p>
        <PromptEditor
          value={promptDraft}
          onChange={setPromptDraft}
          onBlur={handlePromptBlur}
          placeholder="Enter a system prompt…"
        />
      </section>

      {/* Uploaded files */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-200">
            Context Files
          </label>
          <span className="text-xs text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>

        {files.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No context files added yet.</p>
            <p className="text-xs text-gray-600 mt-1">
              Add files via the Context Files tab to give the AI more context.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.hash}
                className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
              >
                <svg
                  className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.filename}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {file.contentPreview.slice(0, 100)}
                    {file.contentPreview.length > 100 ? '…' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.hash)}
                  className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors ml-2"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
