"use client"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import TopBar from "@/components/TopBar"
import { AppStoreProvider } from "@/lib/app-store"
import { AuthProvider, useAuth } from "@/lib/auth-store"

const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"]

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useAuth()

  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isGuest = pathname.startsWith("/guest") || pathname.startsWith("/site")

  // Redirect to login if not authenticated (skip auth & guest routes)
  useEffect(() => {
    if (!state.isLoading && !state.user && !isAuthRoute && !isGuest) {
      router.replace("/login")
    }
  }, [state.isLoading, state.user, isAuthRoute, isGuest, router])

  // Auth routes — full screen, no shell
  if (isAuthRoute) return <>{children}</>

  // Guest / site routes — minimal shell
  if (isGuest) return <AppStoreProvider>{children}</AppStoreProvider>

  // Loading skeleton
  if (state.isLoading || !state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      </div>
    )
  }

  return (
    <AppStoreProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AppStoreProvider>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  )
}
