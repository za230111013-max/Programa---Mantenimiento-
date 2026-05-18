import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GeneralConfigTab } from '../../components/settings/GeneralConfigTab';
import { UsersTab } from '../../components/settings/UsersTab';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Settings, Users, FolderTree, DatabaseBackup, ShieldAlert } from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('config');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { catalogs, auditLogs, exportData, resetDatabase } = useSettingsStore();

  const tabsNav = [
    { id: 'config', label: 'Configuración', icon: Settings },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'catalogs', label: 'Catálogos', icon: FolderTree },
    { id: 'data', label: 'Datos & Respaldo', icon: DatabaseBackup },
    { id: 'audit', label: 'Auditoría', icon: ShieldAlert },
  ];

  // Inline renderers for simpler tabs (Catalogs, Data, Audit)
  const renderSimpleTab = () => {
    if (activeTab === 'catalogs') return (
       <div className="animate-in fade-in bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
         <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Catálogos del Sistema</h2>
         <div className="space-y-6">
           {['area', 'failure_type', 'root_cause'].map((type) => (
             <div key={type}>
               <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                 {type === 'area' ? 'Áreas Físicas' : type === 'failure_type' ? 'Tipos de Falla' : 'Causas Raíz'}
               </h3>
               <div className="flex flex-wrap gap-2">
                 {catalogs.filter(c => c.type === type).map(cat => (
                   <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-secondary-900 border border-gray-200 dark:border-gray-600 rounded-lg">
                     <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">{cat.code}</span>
                     <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{cat.name}</span>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>
       </div>
    );
    
    if (activeTab === 'data') return (
       <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <DatabaseBackup className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Exportar Todo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Descargue toda la BD en formato JSON.</p>
            <button onClick={exportData} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm">Exportar a JSON</button>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reiniciar Datos (Factory Reset)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Eliminará todos los registros actuales y restaurará los mock-data.</p>
            <button onClick={() => setIsResetModalOpen(true)} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm">Reiniciar Sistema</button>
          </div>
       </div>
    );

    if (activeTab === 'audit') return (
       <div className="animate-in fade-in bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
         <div className="p-4 border-b border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-gray-900 dark:text-white">Log de Seguridad / Auditoría</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 dark:bg-secondary-900/50 text-gray-500 dark:text-gray-400">
               <tr>
                 <th className="p-3">Fecha/Hora</th>
                 <th className="p-3">Usuario</th>
                 <th className="p-3">Acción Realizada</th>
                 <th className="p-3">Objeto de Módulo</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
               {auditLogs.map(log => (
                 <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-secondary-900/30">
                   <td className="p-3 font-mono text-xs text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleString('es-MX')}</td>
                   <td className="p-3 font-medium text-gray-900 dark:text-gray-200">{log.user}</td>
                   <td className="p-3 text-gray-700 dark:text-gray-300">{log.action}</td>
                   <td className="p-3"><span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold">{log.module}</span></td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
    );

    return null;
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Administración</h1>
        <nav className="flex flex-col gap-1">
          {tabsNav.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-secondary-800 dark:hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 min-w-0">
        {activeTab === 'config' && <GeneralConfigTab />}
        {activeTab === 'users' && <UsersTab />}
        {renderSimpleTab()}
      </div>

      <ConfirmModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetDatabase}
        title="¿Reiniciar Sistema?"
        message="Se eliminarán todas las órdenes, activos, inventario y análisis personalizados. Esta acción no se puede deshacer y el sistema volverá a sus valores de fábrica."
        confirmText="Reiniciar Todo"
        variant="danger"
      />

    </div>
  );
}
