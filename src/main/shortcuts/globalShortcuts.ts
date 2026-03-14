import { globalShortcut, app, BrowserWindow } from 'electron'
import type { Preferences } from '../../shared/types'

interface ShortcutDeps {
  onTrigger: () => void
  onToggleOverlay: () => void
  getPreferences: () => Preferences
  mainWindow: BrowserWindow | null
}

export function registerShortcuts(deps: ShortcutDeps): void {
  const { onTrigger, onToggleOverlay, getPreferences } = deps
  const prefs = getPreferences()

  // Register trigger shortcut
  const triggerShortcut = prefs.triggerShortcut
  const triggerRegistered = globalShortcut.register(triggerShortcut, () => {
    onTrigger()
  })
  if (!triggerRegistered) {
    console.warn(`globalShortcuts: failed to register trigger shortcut "${triggerShortcut}"`)
  }

  // Register toggle overlay shortcut
  const toggleShortcut = prefs.toggleShortcut
  const toggleRegistered = globalShortcut.register(toggleShortcut, () => {
    onToggleOverlay()
  })
  if (!toggleRegistered) {
    console.warn(`globalShortcuts: failed to register toggle shortcut "${toggleShortcut}"`)
  }

  // Unregister all on app quit
  app.on('will-quit', () => {
    unregisterAll()
  })
}

export function unregisterAll(): void {
  globalShortcut.unregisterAll()
}
