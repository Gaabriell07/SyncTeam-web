import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WorkspacePage from '../../../src/pages/workspace/WorkspacePage'
import { AuthProvider } from '../../../src/context/AuthContext'
import { WorkspaceProvider } from '../../../src/context/WorkspaceContext'
import * as workspaceService from '../../../src/services/workspaceService'
import * as availabilityService from '../../../src/services/availabilityService'

// Mock de servicios
vi.mock('../../../src/services/workspaceService', () => ({
  getWorkspace: vi.fn(),
  toggleMemberStatus: vi.fn(),
  updateMemberRole: vi.fn(),
  deleteWorkspace: vi.fn()
}))

vi.mock('../../../src/services/availabilityService', () => ({
  saveAvailability: vi.fn(),
  getWorkspaceAvailability: vi.fn()
}))

vi.mock('../../../src/services/matcherService', () => ({
  runMatcher: vi.fn()
}))

// Pre-configuramos un usuario
const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' }

const renderWorkspace = (workspaceId = 'ws-1') => {
  return render(
    <MemoryRouter initialEntries={[`/workspace/${workspaceId}`]}>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/workspace/:id" element={<WorkspacePage />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('WorkspacePage', () => {
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

  it('debería renderizar la página y mostrar los detalles del workspace', async () => {
    // Mock de respuesta exitosa
    workspaceService.getWorkspace.mockResolvedValue({
      data: {
        id: 'ws-1',
        name: 'Alpha Project',
        inviteCode: 'code-123',
        members: [{ userId: 'user-1', role: 'LEADER', isActive: true, user: { name: 'Test User' } }]
      }
    })

    availabilityService.getWorkspaceAvailability.mockResolvedValue({ data: [] })

    renderWorkspace()
    
    // Verificamos que se llame al servicio
    expect(workspaceService.getWorkspace).toHaveBeenCalledWith('ws-1')

    await waitFor(() => {
      // El nombre del proyecto debe aparecer en la interfaz (algunas partes de la UI podrían estar en mayúsculas, probar con regex)
      expect(screen.getAllByText(/Alpha Project/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Invitar al Equipo/i).length).toBeGreaterThan(0)
    })
  })
})
