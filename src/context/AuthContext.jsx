import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('syncteam_user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('syncteam_token') || null
  })

  const login = (data) => {
    setUser(data.user || data)
    if (data.token) {
      setToken(data.token)
      localStorage.setItem('syncteam_token', data.token)
    }
    localStorage.setItem('syncteam_user', JSON.stringify(data.user || data))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('syncteam_user')
    localStorage.removeItem('syncteam_token')
    localStorage.removeItem('syncteam_workspace')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
