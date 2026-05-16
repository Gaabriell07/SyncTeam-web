import api from './api'

export const createWorkspace = (data) => api.post('/api/workspaces', data)
export const joinWorkspace = (data) => api.post('/api/workspaces/join', data)
export const getWorkspace = (id) => api.get(`/api/workspaces/${id}`)
