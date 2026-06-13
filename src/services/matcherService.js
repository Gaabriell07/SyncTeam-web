import api from './api'

export const runMatcher = (workspaceId, minScore = 0.5) => 
  api.get(`/api/matcher/${workspaceId}?minScore=${minScore}`)
