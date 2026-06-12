import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { getWorkspace } from '../../services/workspaceService'
import { createTask, getWorkspaceTasks, updateTaskStatus, assignTask, editTask, deleteTask } from '../../services/taskService'
import { socket } from '../../services/socket'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  LogOut, Plus, Users, LayoutDashboard, CheckSquare, 
  Settings, HelpCircle, Layers, MoreHorizontal, ArrowRight,
  Trash2, Edit2
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const STATUS_LABELS = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado'
}

const NEXT_STATUS = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO'
}

const DOT_COLORS = {
  TODO: 'bg-red-500',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-slate-400'
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
  const [openEdit, setOpenEdit] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', assigneeId: '', dueDate: '' })
  const [editForm, setEditForm] = useState({ id: '', title: '', description: '', dueDate: '' })

  useEffect(() => {
    fetchData()

    socket.connect()
    socket.emit('joinWorkspace', id)

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    }

    const handleTaskCreated = (newTask) => {
      setTasks(prev => {
        if (prev.find(t => t.id === newTask.id)) return prev
        return [...prev, newTask]
      })
    }
    
    const handleTaskDeleted = (deletedTask) => {
      setTasks(prev => prev.filter(t => t.id !== deletedTask.id))
    }

    const handleTaskEdited = (editedTask) => {
      setTasks(prev => prev.map(t => t.id === editedTask.id ? editedTask : t))
    }

    socket.on('taskUpdated', handleTaskUpdated)
    socket.on('taskCreated', handleTaskCreated)
    socket.on('taskDeleted', handleTaskDeleted)
    socket.on('taskEdited', handleTaskEdited)

    return () => {
      socket.off('taskUpdated', handleTaskUpdated)
      socket.off('taskCreated', handleTaskCreated)
      socket.off('taskDeleted', handleTaskDeleted)
      socket.off('taskEdited', handleTaskEdited)
      socket.disconnect()
    }
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

  const userRole = members.find(m => m.userId === user?.id)?.role

  const getTodayMin = () => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const handleCreateTask = async () => {
    if (!form.title) return toast.error('Ingresa un título')
    if (form.dueDate && new Date(form.dueDate) < new Date()) {
      return toast.error('La fecha límite no puede ser en el pasado')
    }
    setLoading(true)
    try {
      await createTask({
        title: form.title,
        description: form.description,
        workspaceId: id,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null
      })
      toast.success('Tarea creada')
      setForm({ title: '', description: '', assigneeId: '', dueDate: '' })
      setOpenCreate(false)
      fetchData()
    } catch {
      toast.error('Error al crear la tarea')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = async () => {
    if (!editForm.title) return toast.error('Ingresa un título')
    if (editForm.dueDate && new Date(editForm.dueDate) < new Date()) {
      return toast.error('La fecha límite no puede ser en el pasado')
    }
    setLoading(true)
    try {
      await editTask(editForm.id, {
        title: editForm.title,
        description: editForm.description,
        dueDate: editForm.dueDate || null
      })
      toast.success('Tarea actualizada')
      setOpenEdit(false)
      fetchData()
    } catch {
      toast.error('Error al actualizar la tarea')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea?')) return
    try {
      await deleteTask(taskId)
      toast.success('Tarea eliminada')
      fetchData()
    } catch {
      toast.error('Error al eliminar la tarea')
    }
  }

  const openEditModal = (task) => {
    setEditForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    })
    setOpenEdit(true)
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

  const onDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId !== destination.droppableId) {
      // Optimistic update locally
      const task = tasks.find(t => t.id === draggableId)
      if (task) {
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: destination.droppableId } : t))
        try {
          await updateTaskStatus(draggableId, destination.droppableId)
          fetchData()
        } catch {
          toast.error('Error al actualizar el estado')
          fetchData() // Revert local change on error
        }
      }
    }
  }

  const tasksByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE')
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="bg-slate-900 p-1.5 rounded-md">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">SyncTeam</h1>
                <p className="text-[10px] text-slate-500 font-medium">Academic Workspace</p>
              </div>
            </div>
          </div>

          <div className="px-4 mb-4">
            <Button className="w-full bg-black hover:bg-slate-800 text-white justify-start h-10" onClick={() => navigate('/dashboard')}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-1">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button onClick={() => navigate(`/workspace/${id}`)} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <Users className="w-4 h-4" />
              Teams
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </button>
            <button onClick={() => toast.info('Configuración próximamente')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="p-4 space-y-2 border-t border-slate-100">
          <button onClick={() => toast.info('Centro de ayuda en construcción')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Tablero del Proyecto</h1>
                <p className="text-slate-500 text-sm font-medium">{workspace?.name || 'Cargando...'}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {members?.slice(0,3).map(m => (
                    <Avatar key={m.userId} className="w-8 h-8 border-2 border-white">
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-medium">
                        {m.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members?.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-600 font-medium z-10">
                      +{members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 flex-1 overflow-x-auto pb-4">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                  <div key={status} className="bg-slate-50 rounded-2xl p-4 w-[340px] shrink-0 flex flex-col h-max max-h-full">
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{STATUS_LABELS[status]}</h3>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          {statusTasks.length}
                        </span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tasks List */}
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className={`space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100 rounded-lg' : ''}`}
                        >
                          {statusTasks.map((task, index) => {
                            const assignee = members.find(m => m.userId === task.assigneeId)?.user
                            const canEditOrDelete = userRole === 'LEADER' || task.assigneeId === user?.id
                            
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className={`font-semibold text-sm ${status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                          {task.title}
                                        </h4>
                                        {task.description && (
                                          <p className={`text-xs mt-1.5 line-clamp-2 ${status === 'DONE' ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {task.description}
                                          </p>
                                        )}
                                        {task.dueDate && (
                                          <p className={`text-[10px] mt-2 font-medium ${new Date(task.dueDate) < new Date() && status !== 'DONE' ? 'text-red-500' : 'text-slate-400'}`}>
                                            Fecha límite: {new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                          </p>
                                        )}
                                      </div>
                                      
                                      {/* Action Buttons (Edit / Delete) */}
                                      {canEditOrDelete && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => openEditModal(task)}
                                            className="text-slate-400 hover:text-blue-500 p-1"
                                            title="Editar tarea"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-slate-400 hover:text-red-500 p-1"
                                            title="Eliminar tarea"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4">
                                      {/* Assignee / Select */}
                                      <div className="relative">
                                        <select
                                          value={task.assigneeId || ''}
                                          onChange={(e) => handleAssign(task.id, e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                          title="Cambiar asignado"
                                        >
                                          <option value="">Sin asignar</option>
                                          {members.map(m => (
                                            <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                                          ))}
                                        </select>
                                        <Avatar className="w-6 h-6 border border-slate-200">
                                          <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">
                                            {assignee ? assignee.name.charAt(0).toUpperCase() : '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>

                                      {/* Status Dot */}
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[status]}`}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Add Task Button inside Column */}
                    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                      <DialogTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 py-3 mt-3 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg text-sm font-medium transition-colors">
                          <Plus className="w-4 h-4" />
                          Nueva Tarea
                        </button>
                      </DialogTrigger>
                      {/* Create Task Dialog Content */}
                      <DialogContent className="bg-white border-slate-200 text-slate-900">
                        <DialogHeader>
                          <DialogTitle>Nueva tarea en {STATUS_LABELS[status]}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="space-y-2">
                            <Label className="text-slate-700">Título</Label>
                            <Input
                              placeholder="Ej: Diseñar base de datos"
                              value={form.title}
                              onChange={(e) => setForm({ ...form, title: e.target.value })}
                              className="bg-white border-slate-200 text-slate-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700">Descripción (opcional)</Label>
                            <Input
                              placeholder="Descripción de la tarea"
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              className="bg-white border-slate-200 text-slate-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700">Asignar a (opcional)</Label>
                            <select
                              value={form.assigneeId}
                              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="">Sin asignar</option>
                              {members.map(m => (
                                <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700">Fecha límite (opcional)</Label>
                            <Input
                              type="datetime-local"
                              min={getTodayMin()}
                              value={form.dueDate}
                              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                              className="bg-white border-slate-200 text-slate-900"
                            />
                          </div>
                          <Button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white" onClick={handleCreateTask} disabled={loading}>
                            {loading ? 'Creando...' : 'Crear tarea'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </DragDropContext>

          </div>
        </div>
      </main>

      {/* Edit Task Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-slate-700">Título</Label>
              <Input
                placeholder="Ej: Diseñar base de datos"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Descripción (opcional)</Label>
              <Input
                placeholder="Descripción de la tarea"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Fecha límite (opcional)</Label>
              <Input
                type="datetime-local"
                min={getTodayMin()}
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <Button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white" onClick={handleEditTask} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TasksPage
