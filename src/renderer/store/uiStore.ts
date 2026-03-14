import { create } from 'zustand'
import type { Settings } from '@shared/types'

interface UIStore {
  settings: Settings | null
  isLoading: boolean
  lastTriggerTime: string | null
  lastResponsePreview: string | null
  setSettings: (s: Settings) => void
  updateSettings: (s: Partial<Settings>) => void
  setLoading: (v: boolean) => void
  setLastResponse: (time: string, preview: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  settings: null,
  isLoading: false,
  lastTriggerTime: null,
  lastResponsePreview: null,

  setSettings: (s) => set({ settings: s }),

  updateSettings: (partial) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
    })),

  setLoading: (v) => set({ isLoading: v }),

  setLastResponse: (time, preview) =>
    set({ lastTriggerTime: time, lastResponsePreview: preview }),
}))
