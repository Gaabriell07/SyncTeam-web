import api from './api'

export const saveAvailability = (data) => api.post('/api/availability', data)
export const getWorkspaceAvailability = (workspaceId) => api.get(`/api/availability/${workspaceId}`)
