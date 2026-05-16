import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { getWorkspace } from '../../services/workspaceService'
import { createTask, getWorkspaceTasks, updateTaskStatus, assignTask } from '../../services/taskService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { LogOut, Plus, ArrowLeft } from 'lucide-react'

const STATUS_LABELS = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado'
}

const STATUS_COLORS = {
  TODO: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DONE: 'bg-green-500/10 text-green-400 border-green-500/20'
}

const NEXT_STATUS = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO'
}

const TasksPage = () => {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', assigneeId: '' })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [tasksRes, workspaceRes] = await Promise.all([
        getWorkspaceTasks(id),
        getWorkspace(id)
      ])
      setTasks(tasksRes.data)
      setWorkspace(workspaceRes.data)
      setMembers(workspaceRes.data.members || [])
    } catch {
      toast.error('Error al cargar las tareas')
    }
  }

  const handleCreateTask = async () => {
    if (!form.title) return toast.error('Ingresa un título')
    setLoading(true)
    try {
      await createTask({
        title: form.title,
        description: form.description,
        workspaceId: id,
        assigneeId: form.assigneeId || null
      })
      toast.success('Tarea creada')
      setForm({ title: '', description: '', assigneeId: '' })
      setOpenCreate(false)
      fetchData()
    } catch {
      toast.error('Error al crear la tarea')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (taskId, currentStatus) => {
    try {
      const nextStatus = NEXT_STATUS[currentStatus]
      await updateTaskStatus(taskId, nextStatus)
      toast.success('Estado actualizado')
      fetchData()
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleAssign = async (taskId, assigneeId) => {
    try {
      await assignTask(taskId, assigneeId)
      toast.success('Tarea asignada')
      fetchData()
    } catch {
      toast.error('Error al asignar la tarea')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const tasksByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/workspace/${id}`)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Workspace
          </button>
          <span className="text-slate-700">|</span>
          <h1 className="text-white font-semibold">{workspace?.name} — Tareas</h1>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Nueva tarea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Título</Label>
                  <Input
                    placeholder="Ej: Diseñar base de datos"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Descripción (opcional)</Label>
                  <Input
                    placeholder="Descripción de la tarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Asignar a (opcional)</Label>
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
                <Button className="w-full" onClick={handleCreateTask} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear tarea'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-slate-300 font-semibold">{STATUS_LABELS[status]}</h2>
                <Badge className={STATUS_COLORS[status]}>{statusTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <Card key={task.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <select
                            value={task.assigneeId || ''}
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="">Sin asignar</option>
                            {members.map(m => (
                              <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(task.id, task.status)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            → {STATUS_LABELS[NEXT_STATUS[task.status]]}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded-lg">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default TasksPage
