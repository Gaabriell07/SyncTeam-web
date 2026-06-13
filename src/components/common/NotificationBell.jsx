import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Trash2, CheckCheck, Loader2 } from 'lucide-react'
import { getNotifications, markAllRead, clearNotifications } from '../../services/notificationService'
import { toast } from 'sonner'
import './NotificationBell.css'

const TYPE_ICONS = {
  TASK_STATUS_CHANGE: '🔄',
  TASK_DUE_SOON: '⏰',
  TASK_OVERDUE: '🚨',
  GENERAL: '📢',
}

const NotificationBell = ({ socket }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silencioso
    }
  }, [])

  // Cargar notificaciones al montar
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!socket) return
    const handler = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      toast.info(notification.message, {
        description: notification.title,
        duration: 5000,
      })
    }
    socket.on('notification:new', handler)
    return () => socket.off('notification:new', handler)
  }, [socket])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpen = async () => {
    setOpen(prev => !prev)
    // Marcar como leídas al abrir
    if (!open && unreadCount > 0) {
      try {
        await markAllRead()
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch {/* silencioso */}
    }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      await clearNotifications()
      setNotifications([])
      setUnreadCount(0)
      toast.success('Notificaciones eliminadas')
    } catch {
      toast.error('Error al limpiar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // segundos

    if (diff < 60) return 'Ahora mismo'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      {/* Botón campana */}
      <button
        className="notif-bell-btn"
        onClick={handleOpen}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-header">
            <span className="notif-title">
              <Bell size={15} /> Notificaciones
              {unreadCount === 0 && notifications.length > 0 && (
                <span className="notif-all-read">· Todo leído</span>
              )}
            </span>
            <div className="notif-header-actions">
              {notifications.length > 0 && (
                <button
                  className="notif-clear-btn"
                  onClick={handleClear}
                  disabled={loading}
                  title="Limpiar todo"
                >
                  {loading ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                  Limpiar
                </button>
              )}
              <button className="notif-close-btn" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <CheckCheck size={32} />
                <p>Sin notificaciones</p>
                <span>¡Todo está al día!</span>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                >
                  <span className="notif-item-icon">
                    {TYPE_ICONS[n.type] || '📢'}
                  </span>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-msg">{n.message}</p>
                    <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                  </div>
                  {!n.isRead && <span className="notif-item-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
