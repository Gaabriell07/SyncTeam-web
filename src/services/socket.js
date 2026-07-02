import { io } from 'socket.io-client'

// Using the same API URL logic (assumes backend runs on same host or uses Vite proxy)
// Typically, the backend server URL is the same as the current host or an env var.
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const socket = io(backendUrl, {
  autoConnect: false // We will connect it manually when the user enters the app/workspace
})

// Intercept connect to dynamically inject the token from localStorage
const originalConnect = socket.connect.bind(socket)
socket.connect = () => {
  socket.auth = {
    token: localStorage.getItem('syncteam_token')
  }
  return originalConnect()
}
