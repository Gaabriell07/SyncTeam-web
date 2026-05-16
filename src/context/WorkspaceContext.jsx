import { createContext, useContext, useState } from 'react'

const WorkspaceContext = createContext(null)

export const WorkspaceProvider = ({ children }) => {
  const [workspace, setWorkspace] = useState(() => {
    const stored = localStorage.getItem('syncteam_workspace')
    return stored ? JSON.parse(stored) : null
  })

  const selectWorkspace = (workspaceData) => {
    setWorkspace(workspaceData)
    localStorage.setItem('syncteam_workspace', JSON.stringify(workspaceData))
  }

  const clearWorkspace = () => {
    setWorkspace(null)
    localStorage.removeItem('syncteam_workspace')
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, selectWorkspace, clearWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)
