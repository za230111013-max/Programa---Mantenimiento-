import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { UserPlus, UserCircle, Briefcase, Mail, Key } from 'lucide-react';
import { UserModal } from './UserModal';

export function UsersTab() {
  const { users, toggleUserInit } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleLabels = {
    admin: 'Administrador', planner: 'Planeador', technician: 'Técnico',
    supervisor: 'Supervisor', warehouse: 'Almacén', engineer: 'Ingeniero'
  };
  const roleColors = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    planner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    technician: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    supervisor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    warehouse: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    engineer: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white dark:bg-secondary-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">Administra cuentas y permisos de tu equipo.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors">
          <UserPlus className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className={`bg-white dark:bg-secondary-800 rounded-xl shadow-sm border-l-4 border-r border-t border-b overflow-hidden transition-all duration-200 hover:shadow-md ${u.active ? 'border-l-primary-500 border-gray-100 dark:border-gray-700' : 'border-l-gray-400 border-gray-100 dark:border-gray-700 opacity-60'}`}>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
                  {u.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{u.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {u.position}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${roleColors[u.role] || 'bg-gray-100 text-gray-800'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {u.area}
                    </span>
                    {!u.active && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Inactivo</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center"><Mail className="w-4 h-4 mr-2" />{u.email}</div>
                <div className="flex items-center"><UserCircle className="w-4 h-4 mr-2" />{u.username}</div>
              </div>
            </div>
            {/* Toggle Status Button (Hidden but usable) */}
            <div className="px-5 py-2 bg-gray-50 dark:bg-secondary-900 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button onClick={() => toggleUserInit(u.id)} className={`text-xs font-medium hover:underline ${u.active ? 'text-red-600' : 'text-primary-600 dark:text-primary-400'}`}>
                {u.active ? 'Desactivar Cuenta' : 'Reactivar Cuenta'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
