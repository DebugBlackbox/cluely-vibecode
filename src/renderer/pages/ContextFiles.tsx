import React, { useEffect, useState } from 'react'
import { FileUploader } from '../components/FileUploader'
import type { UploadedFile } from '@shared/types'

interface FileError {
  filename: string
  message: string
}

export const ContextFiles: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<FileError[]>([])
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    window.electronAPI.getFiles().then(setFiles).catch(console.error)
  }, [])

  const handleFilesDropped = async (paths: string[]) => {
    setIsAdding(true)
    const newErrors: FileError[] = []

    for (const filePath of paths) {
      const filename = filePath.split(/[\\/]/).pop() ?? filePath
      try {
        await window.electronAPI.addFile(filePath)
        // Refresh list after each successful add
        const updated = await window.electronAPI.getFiles()
        setFiles(updated)
      } catch (err) {
        newErrors.push({
          filename,
          message: err instanceof Error ? err.message : 'Failed to parse file',
        })
      }
    }

    setErrors((prev) => [...prev, ...newErrors])
    setIsAdding(false)
  }

  const handleRemove = async (hash: string) => {
    try {
      await window.electronAPI.removeFile(hash)
      setFiles((prev) => prev.filter((f) => f.hash !== hash))
    } catch (err) {
      console.error('Failed to remove file', err)
    }
  }

  const dismissError = (filename: string) => {
    setErrors((prev) => prev.filter((e) => e.filename !== filename))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Context Files</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Upload documents to include as context in every AI request
        </p>
      </div>

      <FileUploader
        onFilesDropped={handleFilesDropped}
        accept={['.pdf', '.docx', '.txt', '.md']}
      />

      {isAdding && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Processing files…
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((err) => (
            <div
              key={err.filename}
              className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3"
            >
              <svg
                className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-300">{err.filename}</p>
                <p className="text-xs text-red-400 mt-0.5">{err.message}</p>
              </div>
              <button
                onClick={() => dismissError(err.filename)}
                className="text-red-500 hover:text-red-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-200">Uploaded Files</h2>
          <span className="text-xs text-gray-500">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No files uploaded yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.hash}
                className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 group"
              >
                <svg
                  className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{file.filename}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    {file.contentPreview.slice(0, 100)}
                    {file.contentPreview.length > 100 ? '…' : ''}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Added {new Date(file.addedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(file.hash)}
                  className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
