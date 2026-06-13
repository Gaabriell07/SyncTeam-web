import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import WorkspacePage from '../pages/workspace/WorkspacePage'
import JoinWorkspacePage from '../pages/workspace/JoinWorkspacePage'
import TasksPage from '../pages/tasks/TasksPage'
import ProfilePage from '../pages/profile/ProfilePage'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/dashboard" />
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/workspace/:id" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/workspace/:id/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/invite/:code" element={<ProtectedRoute><JoinWorkspacePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
