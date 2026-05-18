import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function UserModal({ isOpen, onClose }) {
  const addUser = useSettingsStore((state) => state.addUser);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'technician',
    area: 'Mantenimiento',
    position: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addUser(formData);
    onClose();
    setFormData({ name: '', username: '', email: '', password: '', role: 'technician', area: 'Mantenimiento', position: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-primary-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Crear Nuevo Usuario
          </h2>
          <button onClick={onClose} className="hover:bg-primary-700 p-1.5 rounded-full transition-colors text-white">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
               <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario (Login)</label>
               <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
               <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Inicial</label>
               <input type="text" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Puesto de la empresa</label>
               <input type="text" name="position" value={formData.position} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol en el Sistema</label>
               <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm">
                 <option value="admin">Administrador</option>
                 <option value="planner">Planeador</option>
                 <option value="technician">Técnico</option>
                 <option value="supervisor">Supervisor</option>
                 <option value="warehouse">Almacén</option>
                 <option value="engineer">Ingeniero</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área</label>
               <select name="area" value={formData.area} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary-900 dark:text-white rounded-md text-sm">
                 <option value="Mantenimiento">Mantenimiento</option>
                 <option value="Producción">Producción</option>
                 <option value="Almacén">Almacén</option>
                 <option value="Calidad">Calidad</option>
                 <option value="Ingeniería">Ingeniería</option>
               </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-900 border border-gray-300 dark:border-gray-600 rounded-md">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
