'use client'

import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white font-mono text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}