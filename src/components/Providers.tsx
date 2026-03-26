'use client'

import { GlobalDataProvider } from '@/providers/GlobalDataProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalDataProvider>
      {children}
    </GlobalDataProvider>
  )
}
