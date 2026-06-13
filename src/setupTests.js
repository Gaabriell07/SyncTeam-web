import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Ocultar warnings innecesarios de React Router durante los tests
console.warn = vi.fn()
console.error = vi.fn()
