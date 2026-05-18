import { useSettingsStore } from '../../store/useSettingsStore';
import { Moon, Sun, Monitor, Activity, Database, Paintbrush } from 'lucide-react';

export function GeneralConfigTab() {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-secondary-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuración General</h2>
         <p className="text-sm text-gray-500 dark:text-gray-400">Personalización y parámetros estructurales del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appearance Component */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-secondary-900/50">
            <Paintbrush className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Apariencia</h3>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">Tema del Sistema</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Modo actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}
              </span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}>
                {theme === 'dark' ? <Moon className="w-3 h-3 text-primary-600" /> : <Sun className="w-3 h-3 text-amber-500"/>}
              </span>
            </button>
          </div>
        </div>

        {/* Company Settings */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-secondary-900/50">
            <Monitor className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Empresa y Entorno</h3>
          </div>
          <div className="p-0">
             <table className="w-full text-sm text-left">
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400 w-1/3">Nombre Comercial</td>
                   <td className="p-3 text-gray-900 dark:text-gray-200">Manufactura Avanzada CMMS S.A.</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400">Planta</td>
                   <td className="p-3 text-gray-900 dark:text-gray-200">Planta Sur (Industrial)</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400">Moneda</td>
                   <td className="p-3 text-gray-900 dark:text-gray-200">MXN (Peso Mexicano)</td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        {/* Maintenance KPIs */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-secondary-900/50">
            <Activity className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Mantenimiento (KPIs Globales)</h3>
          </div>
          <div className="p-0">
             <table className="w-full text-sm text-left">
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400 w-1/2">Costo Hora Técnico (Promedio)</td>
                   <td className="p-3 font-mono font-bold text-green-600 dark:text-green-400">$350.00 MXN</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400">Meta MTBF (Garantía)</td>
                   <td className="p-3 text-gray-900 dark:text-gray-200">≥ 200 Horas</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-secondary-900/50">
                   <td className="p-3 font-medium text-gray-500 dark:text-gray-400">Meta MTTR (Respuesta)</td>
                   <td className="p-3 text-gray-900 dark:text-gray-200">≤ 4 Horas</td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-secondary-900/50">
            <Database className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Estado de la Base de Datos</h3>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-medium text-gray-900 dark:text-gray-100">Conectada</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Almacenamiento Local (Zustand + React)
              </span>
            </div>
            <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-mono text-sm font-bold border border-green-200 dark:border-green-800">
              OK : 200
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
