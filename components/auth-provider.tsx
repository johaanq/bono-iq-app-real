"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import type { User } from "@/lib/types"

interface AuthContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => {},
})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const refreshUser = async () => {
        try {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
        } catch (error) {
            console.error("Error refreshing user:", error)
            setUser(null)
        }
    }

    useEffect(() => {
        const getInitialSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (session?.user) {
                    const currentUser = await getCurrentUser()
                    setUser(currentUser)

                    // Redirect authenticated users away from auth pages
                    if (pathname === "/login" || pathname === "/sign-up") {
                        router.push("/dashboard")
                    }
                } else {
                    setUser(null)
                    // Redirect unauthenticated users to login (except for public pages)
                    if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
                        router.push("/login")
                    }
                }
            } catch (error) {
                console.error("Error getting initial session:", error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getInitialSession()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === "SIGNED_IN" && session?.user) {
                    const currentUser = await getCurrentUser()
                    setUser(currentUser)
                    router.push("/dashboard")
                } else if (event === "SIGNED_OUT") {
                    setUser(null)
                    router.push("/login")
                }
            } catch (error) {
                console.error("Error handling auth state change:", error)
                setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [router, pathname, supabase.auth])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>
}
