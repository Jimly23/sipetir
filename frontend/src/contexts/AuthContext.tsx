import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { User, UserRole } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hakam_auth_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hakam_auth_token')
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('hakam_auth_token')
      if (storedToken) {
        try {
          const res = await api.get('/me')
          setUser(res.data.data)
          localStorage.setItem('hakam_auth_user', JSON.stringify(res.data.data))
        } catch {
          setUser(null)
          setToken(null)
          localStorage.removeItem('hakam_auth_token')
          localStorage.removeItem('hakam_auth_user')
        }
      }
      setIsLoading(false)
    }

    verifyAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/login', { email, password })
      const { user: userData, token: userToken } = res.data.data
      setUser(userData)
      setToken(userToken)
      localStorage.setItem('hakam_auth_token', userToken)
      localStorage.setItem('hakam_auth_user', JSON.stringify(userData))
      return { success: true }
    } catch (err: unknown) {
      let message = 'Terjadi kesalahan saat login.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        message = axiosErr.response?.data?.message || message
      }
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout')
      }
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('hakam_auth_token')
      localStorage.removeItem('hakam_auth_user')
    }
  }

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
