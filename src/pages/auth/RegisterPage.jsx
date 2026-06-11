import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { registerUser } from '../../services/userService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Layers } from 'lucide-react'

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Completa todos los campos')

    setLoading(true)
    try {
      const res = await registerUser(form)
      login(res.data)
      toast.success('Cuenta creada correctamente')
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
      if (error.response?.status === 409) {
        toast.error('El correo ya está registrado')
      } else {
        toast.error('Error al registrar: ' + (error.response?.data?.error || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo - Decoración */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative flex-col justify-between p-12 overflow-hidden border-r border-slate-200">
        {/* Patrón abstracto sutil de fondo */}
        <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-gradient-to-br from-slate-200/40 via-transparent to-slate-200/20 transform -rotate-12 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-tl from-slate-200/50 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl text-slate-900">
          <Layers className="w-6 h-6 text-slate-800" />
          <span>SyncTeam</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
            Únete a la Revolución.<br />Coordina Mejor.
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Registra tu cuenta y descubre la manera más inteligente de gestionar los horarios y tareas de tu equipo académico sin fricción.
          </p>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 overflow-y-auto">
        <div className="w-full max-w-sm space-y-8 my-auto">
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Crear cuenta
            </h2>
            <p className="text-slate-500 text-sm">
              Crea tu perfil para empezar a colaborar con tu equipo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium text-xs">Nombre Completo</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={handleChange}
                  className="pl-9 bg-white border-slate-200 text-slate-900 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium text-xs">Correo Institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@universidad.edu"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-9 bg-white border-slate-200 text-slate-900 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium text-xs">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-9 pr-9 bg-white border-slate-200 text-slate-900 focus:ring-slate-900 focus:border-slate-900"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-medium shadow-sm py-2 h-10 mt-2" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Inicia sesión aquí
            </Link>
          </div>

          <div className="relative mt-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Portal Académico Seguro</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default RegisterPage
