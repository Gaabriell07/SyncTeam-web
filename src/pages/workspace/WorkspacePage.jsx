import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { getWorkspace, toggleMemberStatus, updateMemberRole, deleteWorkspace } from '../../services/workspaceService'
import { saveAvailability, getWorkspaceAvailability } from '../../services/availabilityService'
import { runMatcher } from '../../services/matcherService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { 
  LogOut, Users, LayoutDashboard, CheckSquare, 
  Settings, HelpCircle, Bell, Search, Layers, ChevronRight, Copy, CheckCircle2, MessageSquare, Plus
} from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DB_DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] // Mapped for backend
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const ROLE_LABELS = {
  LEADER: 'Líder',
  DEVELOPER: 'Desarrollador',
  DESIGNER: 'Diseñador',
  TESTER: 'Tester',
  MEMBER: 'Miembro'
}

const WorkspacePage = () => {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [matcherResult, setMatcherResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMatcher, setLoadingMatcher] = useState(false)
  const [activeTab, setActiveTab] = useState('horario')

  useEffect(() => {
    fetchWorkspace()
    fetchMyAvailability()
  }, [id])

  useEffect(() => {
    if (workspace && user) {
      const member = workspace.members.find(m => m.userId === user.id)
      if (!member || member.isActive === false) {
        toast.error('No tienes acceso a este proyecto o has sido desactivado')
        navigate('/dashboard')
      }
    }
  }, [workspace, user, navigate])

  const fetchWorkspace = async () => {
    try {
      const res = await getWorkspace(id)
      setWorkspace(res.data)
    } catch {
      toast.error('Error al cargar el workspace')
    }
  }

  const fetchMyAvailability = async () => {
    try {
      const res = await getWorkspaceAvailability(id)
      const myAvailability = res.data.find(a => a.userId === user.id)
      if (myAvailability) {
        setSelectedSlots(myAvailability.slots.map(s => `${s.day}-${s.start}`))
      }
    } catch {}
  }

  const toggleSlot = (dbDay, hour) => {
    const key = `${dbDay}-${hour}`
    setSelectedSlots(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  const handleSaveAvailability = async () => {
    setLoading(true)
    try {
      const slots = selectedSlots.map(key => {
        const [day, start] = key.split('-')
        const startIndex = HOURS.indexOf(start)
        const end = HOURS[startIndex + 1] || '21:00'
        return { day, start, end }
      })

      await saveAvailability({ userId: user.id, workspaceId: id, slots })
      toast.success('Disponibilidad guardada')
    } catch {
      toast.error('Error al guardar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const handleRunMatcher = async () => {
    setLoadingMatcher(true)
    setMatcherResult(null)
    try {
      const res = await runMatcher(id)
      setMatcherResult(res.data)
      if (res.data.completeMatches.length === 0 && res.data.partialMatches.length === 0) {
        toast.info('No se encontraron coincidencias')
      } else {
        toast.success('Coincidencias encontradas')
      }
    } catch {
      toast.error('No hay suficiente disponibilidad cargada')
    } finally {
      setLoadingMatcher(false)
    }
  }

  const copyInviteCode = () => {
    const inviteUrl = `${window.location.origin}/invite/${workspace?.inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Enlace de invitación copiado al portapapeles')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleToggleMemberStatus = async (memberId, userId, currentStatus) => {
    // Treat undefined or null as true (active by default)
    const isActive = currentStatus !== false;
    try {
      await toggleMemberStatus(id, userId, !isActive)
      setWorkspace(prev => ({
        ...prev,
        members: prev.members.map(m => 
          m.userId === userId ? { ...m, isActive: !isActive } : m
        )
      }))
      toast.success(`Miembro ${!isActive ? 'activado' : 'desactivado'}`)
    } catch {
      toast.error('Error al actualizar estado del miembro')
    }
  }

  const handleUpdateMemberRole = async (memberId, userId, newRole) => {
    try {
      await updateMemberRole(id, userId, newRole)
      setWorkspace(prev => ({
        ...prev,
        members: prev.members.map(m => 
          m.userId === userId ? { ...m, role: newRole } : m
        )
      }))
      toast.success('Rol actualizado correctamente')
    } catch {
      toast.error('Error al actualizar el rol')
    }
  }

  const handleDeleteWorkspace = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        await deleteWorkspace(id)
        toast.success('Proyecto eliminado exitosamente')
        navigate('/dashboard')
      } catch (error) {
        toast.error('Error al eliminar el proyecto')
      }
    }
  }

  const isLeader = workspace?.members?.find(m => m.userId === user?.id)?.role === 'LEADER'

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
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
            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm">
              <Users className="w-4 h-4" />
              Teams
            </button>
            <button onClick={() => navigate(`/workspace/${id}/tasks`)} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-end shrink-0">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(`/workspace/${id}/tasks`)} className="bg-black hover:bg-slate-800 text-white h-9 px-4 rounded-md font-medium text-sm">
              Create Task
            </Button>
            <button onClick={() => toast.info('No tienes notificaciones nuevas')} className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => toast.info('Centro de ayuda en construcción')} className="text-slate-500 hover:text-slate-700">
              <HelpCircle className="w-5 h-5" />
            </button>
            <Avatar className="w-8 h-8 ml-2 border border-slate-200">
              <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-medium">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Breadcrumb */}
            <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
              <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/dashboard')}>Teams</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-slate-900">{workspace?.name || 'Cargando...'}</span>
            </div>

            {/* Title & Settings Button */}
            <div className="flex items-end justify-between mb-8">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-serif">{workspace?.name}</h1>
              <div className="flex gap-3">
                {isLeader && (
                  <Button 
                    onClick={copyInviteCode} 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 font-medium shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Invitar al Equipo
                  </Button>
                )}
                <Button onClick={() => toast.info('Configuración del equipo en desarrollo')} variant="outline" className="border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 h-9 font-medium shadow-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Team Settings
                </Button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-8 border-b border-slate-200 mb-8">
              <button 
                onClick={() => setActiveTab('horario')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                  activeTab === 'horario' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Horario
              </button>
              <button 
                onClick={() => setActiveTab('matcher')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                  activeTab === 'matcher' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Matcher
              </button>
              <button 
                onClick={() => setActiveTab('miembros')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                  activeTab === 'miembros' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Miembros
              </button>
              {isLeader && (
                <button 
                  onClick={() => setActiveTab('ajustes')}
                  className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                    activeTab === 'ajustes' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Ajustes
                </button>
              )}
            </div>

            {/* Tab Content: Horario */}
            {activeTab === 'horario' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Disponibilidad Semanal</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 bg-blue-100 border border-blue-200 rounded-sm"></div>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 bg-white border border-slate-200 rounded-sm"></div>
                        <span>No disponible</span>
                      </div>
                    </div>
                    <Button onClick={handleSaveAvailability} disabled={loading} size="sm" className="bg-[#0F172A] hover:bg-slate-800 text-white shadow-sm">
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto p-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-20 text-xs font-semibold text-slate-400 text-left pb-4">Hora</th>
                        {DAYS.map((day, idx) => (
                          <th key={day} className="text-xs font-bold text-slate-900 text-center pb-4 w-32">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.slice(0, -1).map(hour => (
                        <tr key={hour}>
                          <td className="text-xs font-medium text-slate-500 align-top pt-2 pr-4 h-16 border-t border-slate-100">
                            {hour}
                          </td>
                          {DB_DAYS.map((dbDay, idx) => {
                            const key = `${dbDay}-${hour}`
                            const selected = selectedSlots.includes(key)
                            return (
                              <td key={dbDay} className="p-0 border-t border-l border-slate-100 first:border-l-0">
                                <button
                                  onClick={() => toggleSlot(dbDay, hour)}
                                  className={`w-full h-full min-h-[64px] transition-colors focus:outline-none ${
                                    selected 
                                      ? 'bg-blue-50 hover:bg-blue-100' 
                                      : 'bg-white hover:bg-slate-50'
                                  }`}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Content: Matcher */}
            {activeTab === 'matcher' && (
              <div className="space-y-10">
                
                {/* Matcher Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Motor Matcher de Horarios</h2>
                    <p className="text-slate-500 mt-2">
                      Analizando la disponibilidad en común para los miembros de '{workspace?.name}'.
                    </p>
                  </div>
                  <Button 
                    onClick={handleRunMatcher} 
                    disabled={loadingMatcher} 
                    className="bg-[#0D47A1] hover:bg-blue-800 text-white font-medium h-10 px-5 shadow-sm"
                  >
                    <svg className={`w-4 h-4 mr-2 ${loadingMatcher ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loadingMatcher ? 'Calculando...' : 'Calcular coincidencias'}
                  </Button>
                </div>

                {matcherResult && (
                  <div className="space-y-12">
                    
                    {/* Complete Matches */}
                    {matcherResult.completeMatches.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-slate-900 mt-1" />
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Coincidencias Completas</h3>
                            <p className="text-slate-500 text-sm">Todos los miembros del equipo pueden asistir en estos horarios.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {matcherResult.completeMatches.map((match, i) => {
                            const startHour = parseInt(match.slot.start.split(':')[0])
                            const endHour = parseInt(match.slot.end.split(':')[0])
                            const durationHrs = endHour - startHour
                            const duration = `${durationHrs}h de duración`
                            
                            return (
                              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {match.slot.day === 'LUN' ? 'LUNES' : 
                                     match.slot.day === 'MAR' ? 'MARTES' : 
                                     match.slot.day === 'MIE' ? 'MIÉRCOLES' : 
                                     match.slot.day === 'JUE' ? 'JUEVES' : 
                                     match.slot.day === 'VIE' ? 'VIERNES' : 
                                     match.slot.day === 'SAB' ? 'SÁBADO' : 'DOMINGO'}
                                  </p>
                                  <h4 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                                    {match.slot.start} - {match.slot.end}
                                  </h4>
                                  <div className="flex items-center text-slate-500 text-sm">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {duration}
                                  </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-slate-900" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Partial Matches */}
                    {matcherResult.partialMatches.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-slate-900 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Coincidencias Parciales</h3>
                            <p className="text-slate-500 text-sm">La mayoría del equipo está disponible, pero requiere ajustes.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {matcherResult.partialMatches.map((match, i) => {
                            const percent = Math.round(match.score * 100)
                            const missingCount = matcherResult.totalMembers - match.attendees.length
                            
                            return (
                              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                                {/* Left: Day & Time */}
                                <div className="w-48">
                                  <p className="font-bold text-slate-900 text-sm mb-1">
                                    {match.slot.day === 'LUN' ? 'Lunes' : 
                                     match.slot.day === 'MAR' ? 'Martes' : 
                                     match.slot.day === 'MIE' ? 'Miércoles' : 
                                     match.slot.day === 'JUE' ? 'Jueves' : 
                                     match.slot.day === 'VIE' ? 'Viernes' : 
                                     match.slot.day === 'SAB' ? 'Sábado' : 'Domingo'}
                                  </p>
                                  <p className="text-slate-500 text-sm mb-1">{match.slot.start} - {match.slot.end}</p>
                                  <p className="text-blue-600 text-xs font-semibold">{parseInt(match.slot.end.split(':')[0]) - parseInt(match.slot.start.split(':')[0])}h de duración</p>
                                </div>

                                {/* Middle: Progress Bar */}
                                <div className="flex-1 max-w-xs mx-8">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-600">{match.attendees.length}/{matcherResult.totalMembers} miembros</span>
                                    <span className="text-xs font-bold text-slate-900">{percent}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600 rounded-full" 
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Right: Avatars */}
                                <div className="flex items-center">
                                  <div className="flex -space-x-2">
                                    {match.attendees.slice(0, 4).map((attId, idx) => {
                                      // Buscar el usuario real
                                      const memberUser = workspace?.members?.find(m => m.userId === attId)?.user
                                      return (
                                        <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                                          <AvatarFallback className="bg-slate-300 text-slate-600 text-[10px] font-bold">
                                            {memberUser ? memberUser.name.charAt(0).toUpperCase() : '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                      )
                                    })}
                                    {missingCount > 0 && (
                                      <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[10px] text-red-600 font-bold z-10">
                                        {missingCount}X
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Miembros */}
            {activeTab === 'miembros' && (
              <div className="space-y-10">
                {/* Header */}
                <div className="flex items-start justify-between pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Miembros del Equipo</h2>
                    <p className="text-slate-500">Gestiona los accesos y roles de tu equipo de investigación.</p>
                  </div>
                  {isLeader && (
                    <Button 
                      onClick={copyInviteCode}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generar Enlace
                    </Button>
                  )}
                </div>

                {/* Table Card */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-medium">Avatar</th>
                          <th className="px-6 py-4 font-medium">Nombre</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">Rol</th>
                          <th className="px-6 py-4 font-medium">Estado</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {workspace?.members?.map((member) => {
                          let badgeColor = 'bg-slate-100 text-slate-600' // Default / Tester
                          if (member.role === 'LEADER') badgeColor = 'bg-blue-600 text-white'
                          else if (member.role === 'DEVELOPER' || member.role === 'DESIGNER') badgeColor = 'bg-blue-100 text-blue-800'
                          
                          return (
                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <Avatar className="w-10 h-10 border border-slate-200">
                                  <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                                    {member.user?.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {member.user?.name}
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {member.user?.email}
                              </td>
                              <td className="px-6 py-4">
                                {isLeader && member.userId !== user?.id ? (
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleUpdateMemberRole(member.id, member.userId, e.target.value)}
                                    className={`border border-slate-200 text-xs rounded-full px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-medium ${badgeColor}`}
                                  >
                                    <option value="MEMBER">Miembro</option>
                                    <option value="DEVELOPER">Desarrollador</option>
                                    <option value="DESIGNER">Diseñador</option>
                                    <option value="TESTER">Tester</option>
                                    <option value="LEADER">Líder</option>
                                  </select>
                                ) : (
                                  <Badge variant="outline" className={`border-transparent font-medium px-3 py-1 text-xs rounded-full ${badgeColor}`}>
                                    {ROLE_LABELS[member.role] || member.role}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={`border-transparent font-medium px-3 py-1 text-xs rounded-full ${member.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {member.isActive !== false ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isLeader && member.userId !== user?.id && (
                                  <button 
                                    onClick={() => handleToggleMemberStatus(member.id, member.userId, member.isActive)}
                                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                                      member.isActive !== false
                                        ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                        : 'text-green-600 bg-green-50 hover:bg-green-100'
                                    }`}
                                  >
                                    {member.isActive !== false ? 'Desactivar' : 'Activar'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer Pagination */}
                  <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Mostrando {workspace?.members?.length || 0} de {workspace?.members?.length || 0} miembros
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-slate-300 cursor-not-allowed">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button className="p-1 text-slate-300 cursor-not-allowed">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Ajustes */}
            {activeTab === 'ajustes' && isLeader && (
              <div className="space-y-10">
                <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Ajustes del Proyecto</h2>
                    <p className="text-slate-500">Configura las opciones avanzadas de tu espacio de trabajo.</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Zona de Peligro</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Una vez que elimines un proyecto, no hay vuelta atrás. Por favor, asegúrate de estar seguro.
                  </p>
                  <Button 
                    onClick={handleDeleteWorkspace}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    Eliminar Proyecto
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default WorkspacePage
