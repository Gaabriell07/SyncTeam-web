import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../../src/context/AuthContext'
import LoginPage from '../../src/pages/auth/LoginPage'
import DashboardPage from '../../src/pages/dashboard/DashboardPage'
import * as userService from '../../src/services/userService'

// Mockeamos las llamadas a la API
vi.mock('../../src/services/userService', () => ({
  loginUser: vi.fn(),
  getWorkspaces: vi.fn().mockResolvedValue({ data: [] }),
  getNotifications: vi.fn().mockResolvedValue({ data: [] })
}))

vi.mock('../../src/services/workspaceService', () => ({
  getWorkspaces: vi.fn().mockResolvedValue({ data: [] })
}))

vi.mock('../../src/services/notificationService', () => ({
  getNotifications: vi.fn().mockResolvedValue({ data: [] })
}))

// Mock de matchMedia necesario por lucide/shadcn
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

import { WorkspaceProvider } from '../../src/context/WorkspaceContext'

// Un router simple para la prueba de integración
const TestRouter = () => {
  return (
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Ruta catch-all para ver redirecciones */}
            <Route path="*" element={<div>Página no encontrada</div>} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Auth Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('debería permitir a un usuario iniciar sesión y ser redirigido al dashboard', async () => {
    // 1. Preparamos el mock del backend
    const mockUser = { id: 1, name: 'Integration User', email: 'test@integration.com' }
    userService.loginUser.mockResolvedValueOnce({
      data: { user: mockUser, token: 'fake-jwt-token' }
    })

    // 2. Renderizamos la app completa (o el fragmento necesario con rutas)
    render(<TestRouter />)

    // 3. Verificamos que estamos en la página de Login
    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument()

    // 4. El usuario llena el formulario
    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })

    fireEvent.change(emailInput, { target: { value: 'test@integration.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // 5. El usuario envía el formulario
    fireEvent.click(submitBtn)

    // 6. Verificamos que el sistema haga la llamada a la API
    await waitFor(() => {
      expect(userService.loginUser).toHaveBeenCalledWith({
        email: 'test@integration.com',
        password: 'password123'
      })
    })

    // 7. Esperamos que, al resolverse el login, el contexto cambie y el enrutador redireccione al Dashboard.
    // Como el `LoginPage` llama a `login(data.token, data.user)` y hace `navigate('/dashboard')`,
    // deberíamos ver elementos del Dashboard (por ejemplo, el texto de bienvenida o la lista de espacios).
    await waitFor(() => {
      expect(screen.getByText(/Aquí tienes un resumen/i)).toBeInTheDocument()
      // Verificamos que el token se haya guardado en localStorage
      expect(localStorage.getItem('syncteam_token')).toBe('fake-jwt-token')
    })
  })
})
