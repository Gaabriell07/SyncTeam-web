import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('syncteam_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('syncteam_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('syncteam_user')
    localStorage.removeItem('syncteam_workspace')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
