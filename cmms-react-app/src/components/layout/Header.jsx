import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';

export function Header({ onMenuToggle }) {
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const typeColors = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button 
          onClick={onMenuToggle}
          className="md:hidden text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-500 hover:text-gray-700 relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Marcar leídas
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin notificaciones
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${typeColors[n.type] || typeColors.info}`}>
                          {n.type || 'info'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.timestamp).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Cargando...'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
