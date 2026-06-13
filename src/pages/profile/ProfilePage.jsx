import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile, getUserActivity } from '../../services/userService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { ArrowLeft, User, Mail, Activity, Save } from 'lucide-react'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'

const ProfilePage = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      fetchActivity(user.id)
    }
  }, [user])

  const fetchActivity = async (userId) => {
    try {
      const res = await getUserActivity(userId)
      setActivities(res.data)
    } catch (error) {
      console.error('Error fetching activity', error)
      toast.error('No se pudo cargar el registro de actividad')
    }
  }

  // Safely converts activity.details to a displayable string
  const renderDetails = (details) => {
    if (!details) return null
    if (typeof details === 'string') return details
    // If it's an object, prefer a 'message' field, otherwise format it nicely
    if (details.message) return details.message
    if (details.title) return `Tarea: "${details.title}"`
    return JSON.stringify(details)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await updateUserProfile({ id: user.id, name, email })
      toast.success('Perfil actualizado correctamente')
      fetchActivity(user.id) 
    } catch (error) {
      console.error(error)
      toast.error('Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center shrink-0">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-600 mr-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Button>
        <h1 className="text-xl font-bold text-slate-900">Perfil de Usuario</h1>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Formulario de Perfil */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                <p className="text-sm text-slate-500">{email}</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? 'Guardando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Registro de Actividad */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Registro de Actividad</h3>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay actividad reciente
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-600 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 text-sm">{activity.action}</div>
                          <time className="text-xs font-medium text-slate-500">
                            {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                        <div className="text-slate-600 text-sm">
                          {renderDetails(activity.details)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ProfilePage
