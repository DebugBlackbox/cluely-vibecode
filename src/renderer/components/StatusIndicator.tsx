import React from 'react'
import { useUIStore } from '../store/uiStore'

export const StatusIndicator: React.FC = () => {
  const isLoading = useUIStore((s) => s.isLoading)

  if (!isLoading) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-full">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
      </span>
      <span className="text-xs font-medium text-blue-300 animate-pulse">
        AI thinking…
      </span>
    </div>
  )
}
