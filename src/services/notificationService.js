import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('syncteam_token')
  return { Authorization: `Bearer ${token}` }
}

export const getNotifications = async () => {
  const { data } = await axios.get(`${API_BASE}/notifications`, {
    headers: getAuthHeaders()
  })
  return data // { notifications: [], unreadCount: 0 }
}

export const markAllRead = async () => {
  const { data } = await axios.patch(`${API_BASE}/notifications/read`, {}, {
    headers: getAuthHeaders()
  })
  return data
}

export const clearNotifications = async () => {
  const { data } = await axios.delete(`${API_BASE}/notifications`, {
    headers: getAuthHeaders()
  })
  return data
}
