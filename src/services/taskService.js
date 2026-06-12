import api from './api'

export const createTask = (data) => api.post('/api/tasks', data)
export const getWorkspaceTasks = (workspaceId) => api.get(`/api/tasks/${workspaceId}`)
export const updateTaskStatus = (id, status) => api.patch(`/api/tasks/${id}/status`, { status })
export const assignTask = (id, assigneeId) => api.patch(`/api/tasks/${id}/assign`, { assigneeId })
export const editTask = (id, data) => api.put(`/api/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`)
