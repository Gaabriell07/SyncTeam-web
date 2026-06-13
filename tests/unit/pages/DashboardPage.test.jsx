import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../../../src/pages/dashboard/DashboardPage'
import { AuthProvider } from '../../../src/context/AuthContext'
import { WorkspaceProvider } from '../../../src/context/WorkspaceContext'
import api from '../../../src/services/api'

// Mock de API
vi.mock('../../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

// Pre-configuramos un usuario en localStorage para que AuthProvider lo cargue
const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <DashboardPage />
        </WorkspaceProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('syncteam_user', JSON.stringify(mockUser))
    localStorage.setItem('syncteam_token', 'fake-token')
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('debería renderizar la página con el saludo al usuario', async () => {
    api.get.mockResolvedValue({ data: { memberships: [] } })
    
    renderDashboard()
    
    expect(screen.getByText('¡Hola, Test!')).toBeInTheDocument()
    expect(screen.getByText('Aquí tienes un resumen de tus equipos académicos activos.')).toBeInTheDocument()
  })

  it('debería mostrar la lista de workspaces si el usuario tiene membresías', async () => {
    const mockMemberships = [
      {
        workspaceId: 'ws-1',
        role: 'LEADER',
        workspace: { id: 'ws-1', name: 'Project Alpha', members: [] }
      },
      {
        workspaceId: 'ws-2',
        role: 'DEVELOPER',
        workspace: { id: 'ws-2', name: 'Project Beta', members: [] }
      }
    ]

    api.get.mockResolvedValue({ data: { memberships: mockMemberships } })
    
    renderDashboard()
    
    // Esperamos a que los proyectos carguen asincronamente
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Project Beta')).toBeInTheDocument()
    })
  })
})
