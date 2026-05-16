import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { createWorkspace, joinWorkspace } from '../../services/workspaceService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { LogOut, Plus, Users } from 'lucide-react'

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { selectWorkspace } = useWorkspace()
  const navigate = useNavigate()

  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [role, setRole] = useState('DEVELOPER')
  const [loading, setLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [openJoin, setOpenJoin] = useState(false)

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
      const res = await joinWorkspace({ inviteCode, userId: user.id, role })
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">SyncTeam</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">Bienvenido, {user?.name}</h2>
          <p className="text-slate-400 mt-1">Crea o únete a un workspace para comenzar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Card className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Crear workspace</CardTitle>
                      <CardDescription className="text-slate-400">
                        Inicia un nuevo proyecto grupal
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Nuevo workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre del proyecto</Label>
                  <Input
                    placeholder="Ej: Proyecto Final BD"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button className="w-full" onClick={handleCreateWorkspace} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear workspace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openJoin} onOpenChange={setOpenJoin}>
            <DialogTrigger asChild>
              <Card className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Unirse a workspace</CardTitle>
                      <CardDescription className="text-slate-400">
                        Ingresa con un código de invitación
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Unirse a workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Código de invitación</Label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tu rol</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="DEVELOPER">Desarrollador</option>
                    <option value="DESIGNER">Diseñador</option>
                    <option value="TESTER">Tester</option>
                    <option value="LEADER">Líder</option>
                  </select>
                </div>
                <Button className="w-full" onClick={handleJoinWorkspace} disabled={loading}>
                  {loading ? 'Uniéndose...' : 'Unirse'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
