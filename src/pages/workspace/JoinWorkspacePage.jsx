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
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    try {
      const res = await joinWorkspace({ inviteCode: code, userId: user.id })
      toast.success('Te has unido al equipo exitosamente')
      if (res.data && res.data.id) {
        navigate(`/workspace/${res.data.id}`)
      } else {
        navigate('/dashboard')
      }
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
          <CardTitle className="text-2xl text-white">Unirse al Equipo</CardTitle>
          <CardDescription className="text-slate-400">
            Has sido invitado a colaborar en este espacio de trabajo. Ingresarás como Miembro estándar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 pt-4">
            <Button className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white" onClick={handleJoin} disabled={loading}>
              {loading ? 'Uniéndose...' : 'Aceptar Invitación'}
            </Button>
            <Button variant="outline" className="w-full h-12 text-base font-medium border-slate-700 text-slate-300 hover:text-slate-900 hover:bg-slate-50" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JoinWorkspacePage
