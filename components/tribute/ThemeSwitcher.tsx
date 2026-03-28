'use client'

/**
 * Theme switcher — 4 circular swatches at bottom of tribute page
 * Instant preview via CSS class change (no page reload)
 */


import type { TemplateId } from '@/lib/types'

const THEMES: Array<{
  id: TemplateId
  name: string
  color: string
  activeColor: string
}> = [
  { id: 'golden-hour', name: 'Golden Hour', color: '#D97706', activeColor: '#B45309' },
  { id: 'classic', name: 'Classic', color: '#1E3A5F', activeColor: '#152A47' },
  { id: 'garden', name: 'Garden', color: '#4D7C5F', activeColor: '#3A6349' },
  { id: 'minimal', name: 'Minimal', color: '#6B7280', activeColor: '#374151' },
]

interface ThemeSwitcherProps {
  currentTheme: TemplateId
  onThemeChange: (theme: TemplateId) => void
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <span
        className="text-xs mr-1"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}
      >
        Theme:
      </span>
      {THEMES.map(theme => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`theme-swatch ${currentTheme === theme.id ? 'active' : ''}`}
          style={{
            backgroundColor: theme.color,
            border: currentTheme === theme.id ? `2px solid ${theme.activeColor}` : '2px solid transparent',
            outline: currentTheme === theme.id ? `2px solid ${theme.color}` : 'none',
            outlineOffset: '2px',
          }}
          title={theme.name}
          aria-label={`Switch to ${theme.name} theme`}
          aria-pressed={currentTheme === theme.id}
        />
      ))}
    </div>
  )
}
