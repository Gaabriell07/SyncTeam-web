import api from './api'

export const registerUser = (data) => api.post('/api/users/register', data)
export const getUserById = (id) => api.get(`/api/users/${id}`)
