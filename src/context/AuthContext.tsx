import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { parseUserSession, type UserProfile, type UserSession } from '../services/session'

interface AuthContextValue {
    session: UserSession
    isAuthenticated: boolean
    user: UserProfile | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
