import React, { useCallback, useRef } from 'react'

interface DragState {
  startClientX: number
  startClientY: number
}

export function OverlayControls() {
  const draggingRef = useRef(false)
  const dragStateRef = useRef<DragState | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    draggingRef.current = true
    dragStateRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !dragStateRef.current) return

    const deltaX = e.clientX - dragStateRef.current.startClientX
    const deltaY = e.clientY - dragStateRef.current.startClientY

    if (deltaX !== 0 || deltaY !== 0) {
      window.electronAPI.overlayDrag(deltaX, deltaY)
      dragStateRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
      }
    }
  }, [])

  const stopDrag = useCallback(() => {
    draggingRef.current = false
    dragStateRef.current = null
  }, [])

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      className="flex items-center justify-center h-6 w-full bg-white/5 hover:bg-white/10 transition-colors border-b border-white/10 select-none"
      style={{ cursor: draggingRef.current ? 'grabbing' : 'grab' }}
      title="Drag to move"
      aria-label="Drag handle"
    >
      <span className="text-white/30 text-xs tracking-widest">⠿ ⠿ ⠿</span>
    </div>
  )
}
