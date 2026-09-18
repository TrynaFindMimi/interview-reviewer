import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getInitialMode() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create(
  persist(
    (set) => ({
      mode: getInitialMode(),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'interview-reviewer-theme' },
  ),
)