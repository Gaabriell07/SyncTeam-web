import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { joinWorkspace } from '../../services/workspaceService'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

import { Input } from '../../components/ui/input'

const JoinWorkspacePage = () => {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    try {
      const res = await joinWorkspace({ inviteCode: code, userId: user.id, role })
      toast.success('Te has unido al equipo')
      navigate(`/workspace/${res.data.id}`)
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Ya eres miembro de este equipo')
        navigate('/dashboard')
      } else {
        toast.error('Error al unirse: código inválido o expirado')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Unirse a un Equipo</CardTitle>
          <CardDescription className="text-slate-400">
            Has sido invitado a colaborar. Selecciona tu rol para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Cargo en el equipo (Ej: Investigador, Diseñador, Expositor)</label>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Escribe tu cargo o rol..."
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
            <Button className="w-full" onClick={handleJoin} disabled={loading}>
              {loading ? 'Uniéndose...' : 'Unirme ahora'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JoinWorkspacePage
