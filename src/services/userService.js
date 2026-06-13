import api from './api'

export const registerUser = (data) => api.post('/api/users/register', data)
export const loginUser = (data) => api.post('/api/users/login', data)
export const getUserById = (id) => api.get(`/api/users/${id}`)
export const updateUserProfile = (data) => api.put('/api/users/profile', data)
export const getUserActivity = (id) => api.get(`/api/users/${id}/activity`)
