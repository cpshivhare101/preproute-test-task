import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from './ui/Skeleton'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) {
    return <PageLoader />
  }

  return <>{children}</>
}
