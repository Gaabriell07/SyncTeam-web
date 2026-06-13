import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../../src/pages/auth/LoginPage'
import { AuthProvider } from '../../../src/context/AuthContext'
import * as userService from '../../../src/services/userService'
import { toast } from 'sonner'

// Mock de la dependencia axios interna del servicio
vi.mock('../../../src/services/userService', () => ({
  loginUser: vi.fn()
}))

// Mock de sonner para evitar renders molestos y comprobar las llamadas
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock window.matchMedia para dependencias UI (lucide-react/shadcn)
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

const renderLoginPage = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('debería renderizar el formulario de inicio de sesión', () => {
    renderLoginPage()
    
    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('debería mostrar un error si se intenta enviar el formulario vacío', async () => {
    renderLoginPage()
    
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })
    fireEvent.click(submitBtn)
    
    // Verificamos que el toast de error fue llamado
    expect(toast.error).toHaveBeenCalledWith('Ingresa tu correo y contraseña')
    expect(userService.loginUser).not.toHaveBeenCalled()
  })

  it('debería llamar a loginUser y redirigir al éxito', async () => {
    userService.loginUser.mockResolvedValue({
      data: { user: { id: 1, name: 'Test' }, token: 'fake-token' }
    })

    renderLoginPage()
    
    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })

    // Escribimos en los inputs
    fireEvent.change(emailInput, { target: { value: 'test@correo.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    
    // Hacemos submit
    fireEvent.click(submitBtn)

    // Esperamos que se resuelva la promesa simulada
    await waitFor(() => {
      expect(userService.loginUser).toHaveBeenCalledWith({
        email: 'test@correo.com',
        password: '123456'
      })
    })

    expect(toast.success).toHaveBeenCalledWith('Bienvenido de vuelta')
  })
})
