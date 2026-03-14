import React from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploaderProps {
  onFilesDropped: (paths: string[]) => void
  accept?: string[]
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesDropped,
  accept = ['.pdf', '.docx', '.txt', '.md'],
}) => {
  const acceptMap = accept.reduce<Record<string, string[]>>((acc, ext) => {
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
    }
    const mime = mimeMap[ext] ?? 'application/octet-stream'
    if (!acc[mime]) acc[mime] = []
    acc[mime].push(ext)
    return acc
  }, {})

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptMap,
    onDrop: (acceptedFiles) => {
      // In Electron, File objects have a .path property
      const paths = acceptedFiles.map((f) => (f as File & { path: string }).path)
      onFilesDropped(paths)
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <svg
          className={`w-10 h-10 ${isDragActive ? 'text-blue-400' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isDragActive ? (
          <p className="text-sm font-medium">Drop files here…</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag &amp; drop files here</p>
            <p className="text-xs text-gray-500">
              or <span className="text-blue-400 underline">click to browse</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Accepts: {accept.join(', ')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
