import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface UserProfile {
    user_id: number
    first_name: string
    email: string
    phone: string
    language: string
    region_id: number
    user_type: {
        user_type_name: string
        user_type_id: number
        allow_post_listing: boolean
        permissions: string[]
    }
    has_listings: boolean
}

interface UserSession {
    status: 'logged_in' | 'guest'
    profile: UserProfile | null
    token: string | null
    device_id: string | null
    environment: string | null
}

interface AuthContextValue {
    session: UserSession
    isAuthenticated: boolean
    user: UserProfile | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseUserSession(): UserSession {
    const fallback: UserSession = { status: 'guest', profile: null, token: null, device_id: null, environment: null }

    try {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const sessionCookie = cookies.find(c => c.startsWith('user_session='))
        if (!sessionCookie) return fallback

        const rawValue = sessionCookie.split('=').slice(1).join('=')
        if (!rawValue) return fallback

        // Double URL-encoded: decode twice
        const decoded = decodeURIComponent(decodeURIComponent(rawValue))
        const parsed = JSON.parse(decoded) as UserSession

        if (parsed.status !== 'logged_in' || !parsed.profile?.user_id) {
            console.log("The user is not logged in")
            return { ...parsed, status: 'guest', profile: null }
        } else {
            console.log("The user is logged in")
            return parsed
        }
    } catch {
        console.log("The user is not logged in")
        return fallback
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<UserSession>(parseUserSession)

    useEffect(() => {
        // Re-parse on focus in case cookie changed (login/logout in another tab)
        const handleFocus = () => setSession(parseUserSession())
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [])

    const value: AuthContextValue = {
        session,
        isAuthenticated: session.status === 'logged_in' && !!session.profile,
        user: session.profile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
