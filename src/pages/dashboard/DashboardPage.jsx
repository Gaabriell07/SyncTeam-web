import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { createWorkspace, joinWorkspace, toggleMemberStatus } from '../../services/workspaceService'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { 
  LogOut, Plus, Users, LayoutDashboard, CheckSquare, 
  Settings, HelpCircle, Search, Beaker, Book, MessageSquare, CheckCircle2, Layers, User
} from 'lucide-react'
import NotificationBell from '../../components/common/NotificationBell'
import { socket } from '../../services/socket'

const ROLE_LABELS = {
  LEADER: 'LÍDER',
  DEVELOPER: 'DEVELOPER',
  DESIGNER: 'DESIGNER',
  TESTER: 'TESTER'
}

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { selectWorkspace } = useWorkspace()
  const navigate = useNavigate()

  const [workspaces, setWorkspaces] = useState([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [openJoin, setOpenJoin] = useState(false)

  useEffect(() => {
    fetchUserData()
    // Conectar socket y unirse a la sala personal para notificaciones
    if (user?.id) {
      socket.connect()
      socket.emit('joinUserRoom', user.id)
    }
    return () => {
      socket.off('notification:new')
    }
  }, [user?.id])

  const fetchUserData = async () => {
    try {
      const res = await api.get(`/api/users/${user.id}`)
      if (res.data && res.data.memberships) {
        setWorkspaces(res.data.memberships.filter(m => m.isActive !== false))
      }
    } catch (error) {
      console.error('Error fetching user data', error)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName) return toast.error('Ingresa un nombre')
    setLoading(true)
    try {
      const res = await createWorkspace({ name: newWorkspaceName, userId: user.id })
      selectWorkspace(res.data)
      toast.success('Workspace creado')
      navigate(`/workspace/${res.data.id}`)
    } catch {
      toast.error('Error al crear el workspace')
    } finally {
      setLoading(false)
      setOpenCreate(false)
    }
  }

  const handleJoinWorkspace = async () => {
    if (!inviteCode) return toast.error('Ingresa el código de invitación')
    setLoading(true)
    try {
      const res = await joinWorkspace({ inviteCode, userId: user.id })
      selectWorkspace(res.data)
      toast.success('Te uniste al workspace')
      navigate(`/workspace/${res.data.id}`)
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Ya eres miembro de este workspace')
      } else {
        toast.error('Código de invitación inválido')
      }
    } finally {
      setLoading(false)
      setOpenJoin(false)
    }
  }

  const handleLeaveWorkspace = async (e, workspaceId) => {
    e.stopPropagation()
    if (!window.confirm('¿Seguro que quieres abandonar este proyecto?')) return
    try {
      await toggleMemberStatus(workspaceId, user.id, false)
      toast.success('Has abandonado el proyecto')
      fetchUserData()
    } catch (err) {
      toast.error('Error al abandonar el proyecto')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1.5 rounded-md">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">SyncTeam</h1>
                <p className="text-[10px] text-slate-500 font-medium">Academic Workspace</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-1">
            <button onClick={() => toast.info('Estás en el Dashboard viendo tus equipos')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button onClick={() => toast.info('Selecciona un equipo para ver sus detalles')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <Users className="w-4 h-4" />
              Teams
            </button>
            <button onClick={() => toast.info('Selecciona un equipo para ver sus tareas')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </button>
            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              <User className="w-4 h-4" />
              Profile
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="p-4 space-y-2">
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="w-full bg-black hover:bg-slate-800 text-white justify-start mb-4 h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200 text-slate-900">
                <DialogHeader>
                  <DialogTitle>Nuevo workspace</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Nombre del proyecto</Label>
                    <Input
                      placeholder="Ej: Proyecto Final BD"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                  <Button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white" onClick={handleCreateWorkspace} disabled={loading}>
                    {loading ? 'Creando...' : 'Crear workspace'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-end shrink-0">
            <div className="flex items-center gap-4">
              <Button onClick={() => setOpenCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-full font-medium text-sm">
                Create New
              </Button>
              <Dialog open={openJoin} onOpenChange={setOpenJoin}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 px-4 rounded-full font-medium text-sm border-slate-200 text-slate-700">
                    Join Workspace
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-slate-200 text-slate-900">
                  <DialogHeader>
                    <DialogTitle>Unirse a workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Código de invitación</Label>
                      <Input
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="bg-white border-slate-200 text-slate-900"
                      />
                    </div>
                    <Button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white" onClick={handleJoinWorkspace} disabled={loading}>
                      {loading ? 'Uniéndose...' : 'Unirse'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <NotificationBell socket={socket} />
            <Avatar className="w-8 h-8 ml-2 border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
              <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-medium">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">¡Hola, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-500 mt-1">Aquí tienes un resumen de tus equipos académicos activos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Workspace Cards */}
              {workspaces.map((membership, i) => (
                <div 
                  key={membership.workspaceId}
                  onClick={() => navigate(`/workspace/${membership.workspaceId}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-56"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                      {i % 2 === 0 ? <Beaker className="w-5 h-5" /> : <Book className="w-5 h-5" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {ROLE_LABELS[membership.role] || 'MIEMBRO'}
                      </Badge>
                      <button 
                        onClick={(e) => handleLeaveWorkspace(e, membership.workspaceId)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Abandonar proyecto"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{membership.workspace.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      Espacio de trabajo para coordinar el proyecto {membership.workspace.name}. Gestiona tareas y horarios aquí.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {membership.workspace.members?.slice(0,3).map(m => (
                        <Avatar key={m.id} className="w-7 h-7 border-2 border-white">
                          <AvatarFallback className="bg-slate-200 text-slate-700 text-[10px]">
                            {m.user?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {membership.workspace.members?.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-medium z-10">
                          +{membership.workspace.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      {i % 2 === 0 ? <CheckCircle2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      <span>{membership.workspace.members?.length}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create New Card */}
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center h-56 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Nuevo Espacio</h3>
                    <p className="text-sm text-slate-500">Crear desde cero o plantilla</p>
                  </div>
                </DialogTrigger>
                {/* Create Workspace Dialog Content */}
                <DialogContent className="bg-white border-slate-200 text-slate-900">
                  <DialogHeader>
                    <DialogTitle>Nuevo workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Nombre del proyecto</Label>
                      <Input
                        placeholder="Ej: Proyecto Final BD"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="bg-white border-slate-200 text-slate-900"
                      />
                    </div>
                    <Button className="w-full bg-[#0F172A] hover:bg-slate-800 text-white" onClick={handleCreateWorkspace} disabled={loading}>
                      {loading ? 'Creando...' : 'Crear workspace'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
