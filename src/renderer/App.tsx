import React, { useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useUIStore } from './store/uiStore'
import { Dashboard } from './pages/Dashboard'
import { ContextFiles } from './pages/ContextFiles'
import { Preferences } from './pages/Preferences'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/files', label: 'Context Files', exact: false },
  { to: '/preferences', label: 'Preferences', exact: false },
]

export const App: React.FC = () => {
  const setSettings = useUIStore((s) => s.setSettings)

  useEffect(() => {
    window.electronAPI
      .getSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings', err))
  }, [setSettings])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top nav bar */}
      <nav className="flex-shrink-0 border-b border-gray-700/60 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center px-4 h-12 gap-1">
          {/* Brand */}
          <div className="flex items-center gap-2 mr-6">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Cluely</span>
          </div>

          {/* Nav links */}
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<ContextFiles />} />
          <Route path="/preferences" element={<Preferences />} />
        </Routes>
      </main>
    </div>
  )
}
