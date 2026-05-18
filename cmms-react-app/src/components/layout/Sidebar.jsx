import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Wrench, Package, FileText, Settings, LogOut, Calendar, Activity, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

const allNavItems = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'supervisor', 'tecnico'] },
  { name: 'Órdenes', href: '/orders', icon: Wrench, roles: ['admin', 'supervisor', 'tecnico'] },
  { name: 'Preventivo', href: '/preventive', icon: Calendar, roles: ['admin', 'supervisor', 'tecnico'] },
  { name: 'Predictivo', href: '/predictive', icon: Activity, roles: ['admin', 'supervisor', 'tecnico'] },
  { name: 'Inventario', href: '/inventory', icon: Package, roles: ['admin', 'supervisor', 'tecnico'] },
  { name: 'AMEF', href: '/amef', icon: FileText, roles: ['admin', 'supervisor'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['admin', 'supervisor'] },
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items by user role
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'tecnico'));

  return (
    <aside className={cn(
      "flex flex-col w-64 bg-secondary-900 border-r border-gray-800 text-gray-300 z-50 transition-transform duration-300",
      // Desktop: always visible
      "md:relative md:translate-x-0",
      // Mobile: slide in/out
      "fixed inset-y-0 left-0",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex items-center justify-between h-16 border-b border-gray-800 px-4">
        <div className="flex items-center text-white font-bold text-xl tracking-wider">
          <Wrench className="w-6 h-6 mr-2 text-primary-500" />
          CMMS PRO
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
        <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary-600 text-white" 
                      : "hover:bg-secondary-800 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-400")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-300 rounded-md hover:bg-secondary-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-400" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
