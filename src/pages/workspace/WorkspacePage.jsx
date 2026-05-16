import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { getWorkspace } from '../../services/workspaceService'
import { saveAvailability, getWorkspaceAvailability } from '../../services/availabilityService'
import { runMatcher } from '../../services/matcherService'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { LogOut, Copy, CheckCircle, Users, Clock, ListTodo } from 'lucide-react'

const DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const ROLE_LABELS = {
  LEADER: 'Líder',
  DEVELOPER: 'Desarrollador',
  DESIGNER: 'Diseñador',
  TESTER: 'Tester'
}

const ROLE_COLORS = {
  LEADER: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  DEVELOPER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DESIGNER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  TESTER: 'bg-green-500/10 text-green-400 border-green-500/20'
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

  useEffect(() => {
    fetchWorkspace()
    fetchMyAvailability()
  }, [id])

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

  const toggleSlot = (day, hour) => {
    const key = `${day}-${hour}`
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
    navigator.clipboard.writeText(workspace?.inviteCode)
    toast.success('Código copiado')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </button>
          <span className="text-slate-700">|</span>
          <h1 className="text-white font-semibold">{workspace?.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(`/workspace/${id}/tasks`)}
            className="border-slate-700 text-slate-300 hover:text-white">
            <ListTodo className="w-4 h-4 mr-2" />
            Tareas
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="disponibilidad">
          <TabsList className="bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger value="disponibilidad" className="data-[state=active]:bg-slate-800">
              <Clock className="w-4 h-4 mr-2" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="matcher" className="data-[state=active]:bg-slate-800">
              <CheckCircle className="w-4 h-4 mr-2" />
              Matcher
            </TabsTrigger>
            <TabsTrigger value="miembros" className="data-[state=active]:bg-slate-800">
              <Users className="w-4 h-4 mr-2" />
              Miembros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disponibilidad">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Mi disponibilidad horaria</CardTitle>
                <Button onClick={handleSaveAvailability} disabled={loading} size="sm">
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-slate-400 font-normal py-2 pr-4 text-left">Hora</th>
                        {DAYS.map(day => (
                          <th key={day} className="text-slate-400 font-normal py-2 px-2 text-center">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.slice(0, -1).map(hour => (
                        <tr key={hour}>
                          <td className="text-slate-500 py-1 pr-4 text-xs">{hour}</td>
                          {DAYS.map(day => {
                            const key = `${day}-${hour}`
                            const selected = selectedSlots.includes(key)
                            return (
                              <td key={day} className="px-2 py-1 text-center">
                                <button
                                  onClick={() => toggleSlot(day, hour)}
                                  className={`w-8 h-8 rounded transition-colors ${
                                    selected
                                      ? 'bg-blue-500 hover:bg-blue-600'
                                      : 'bg-slate-800 hover:bg-slate-700'
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matcher">
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Motor Matcher</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    Encuentra los mejores horarios para tu equipo
                  </p>
                </div>
                <Button onClick={handleRunMatcher} disabled={loadingMatcher}>
                  {loadingMatcher ? 'Calculando...' : 'Calcular coincidencias'}
                </Button>
              </CardHeader>
            </Card>

            {matcherResult && (
              <div className="space-y-4">
                {matcherResult.completeMatches.length > 0 && (
                  <div>
                    <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Coincidencias completas ({matcherResult.completeMatches.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {matcherResult.completeMatches.map((match, i) => (
                        <Card key={i} className="bg-green-500/5 border-green-500/20">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">{match.slot.day}</p>
                                <p className="text-slate-400 text-sm">{match.slot.start} - {match.slot.end}</p>
                              </div>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                {match.attendees.length}/{matcherResult.totalMembers} disponibles
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {matcherResult.partialMatches.length > 0 && (
                  <div>
                    <h3 className="text-yellow-400 font-semibold mb-3">
                      Coincidencias parciales ({matcherResult.partialMatches.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {matcherResult.partialMatches.map((match, i) => (
                        <Card key={i} className="bg-yellow-500/5 border-yellow-500/20">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">{match.slot.day}</p>
                                <p className="text-slate-400 text-sm">{match.slot.start} - {match.slot.end}</p>
                              </div>
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                {Math.round(match.score * 100)}% del equipo
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="miembros">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Miembros del equipo</CardTitle>
                <Button variant="outline" size="sm" onClick={copyInviteCode}
                  className="border-slate-700 text-slate-300 hover:text-white">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar invitación
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workspace?.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-700 text-white text-xs">
                            {member.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">{member.user?.name}</p>
                          <p className="text-slate-400 text-xs">{member.user?.email}</p>
                        </div>
                      </div>
                      <Badge className={ROLE_COLORS[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default WorkspacePage
