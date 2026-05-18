import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Local Users Database ────────────────────────────────────────────────
const initialUsers = [
  { id: 'usr_001', name: 'Administrador del Sistema', username: 'admin', email: 'admin@empresa.com', role: 'admin', area: 'Mantenimiento', position: 'Gerente de Mantenimiento', active: true },
  { id: 'usr_002', name: 'Supervisor de Planta', username: 'supervisor', email: 'supervisor@empresa.com', role: 'supervisor', area: 'Producción', position: 'Supervisor de Línea', active: true },
  { id: 'usr_003', name: 'Técnico de Guardia', username: 'tecnico', email: 'tecnico@empresa.com', role: 'technician', area: 'Mantenimiento', position: 'Técnico Mecánico', active: true },
  { id: 'usr_004', name: 'Ing. Carlos Mendoza', username: 'carlos.m', email: 'carlos@empresa.com', role: 'engineer', area: 'Ingeniería', position: 'Ingeniero de Confiabilidad', active: true },
  { id: 'usr_005', name: 'Ana López', username: 'ana.lopez', email: 'ana@empresa.com', role: 'planner', area: 'Mantenimiento', position: 'Planeadora de Mantenimiento', active: true },
  { id: 'usr_006', name: 'Roberto Almacén', username: 'roberto.a', email: 'roberto@empresa.com', role: 'warehouse', area: 'Almacén', position: 'Encargado de Almacén', active: true },
];

// ─── Catalogs ────────────────────────────────────────────────────────────
const initialCatalogs = [
  { id: 'cat_001', type: 'area', code: 'PROD', name: 'Producción' },
  { id: 'cat_002', type: 'area', code: 'SERV', name: 'Servicios' },
  { id: 'cat_003', type: 'area', code: 'MAQ', name: 'Maquinado' },
  { id: 'cat_004', type: 'area', code: 'ALM', name: 'Almacén' },
  { id: 'cat_005', type: 'failure_type', code: 'MEC', name: 'Falla Mecánica' },
  { id: 'cat_006', type: 'failure_type', code: 'ELEC', name: 'Falla Eléctrica' },
  { id: 'cat_007', type: 'failure_type', code: 'NEUM', name: 'Falla Neumática' },
  { id: 'cat_008', type: 'failure_type', code: 'HID', name: 'Falla Hidráulica' },
  { id: 'cat_009', type: 'root_cause', code: 'DESG', name: 'Desgaste Natural' },
  { id: 'cat_010', type: 'root_cause', code: 'LUB', name: 'Falta de Lubricación' },
  { id: 'cat_011', type: 'root_cause', code: 'OPER', name: 'Error de Operación' },
  { id: 'cat_012', type: 'root_cause', code: 'SOBR', name: 'Sobrecarga' },
];

// ─── Audit Logs ──────────────────────────────────────────────────────────
const initialAuditLogs = [
  { id: 'log_001', date: new Date(Date.now() - 86400000).toISOString(), user: 'Administrador', action: 'Creó orden OT-2024001', module: 'Órdenes' },
  { id: 'log_002', date: new Date(Date.now() - 172800000).toISOString(), user: 'Supervisor', action: 'Cerró orden OT-2024003', module: 'Órdenes' },
  { id: 'log_003', date: new Date(Date.now() - 259200000).toISOString(), user: 'Técnico', action: 'Consumió 2x ROD-6205-2RS', module: 'Inventario' },
  { id: 'log_004', date: new Date(Date.now() - 345600000).toISOString(), user: 'Administrador', action: 'Ejecutó plan preventivo BMB-01', module: 'Preventivo' },
  { id: 'log_005', date: new Date(Date.now() - 432000000).toISOString(), user: 'Supervisor', action: 'Actualizó umbrales CNC-03', module: 'Predictivo' },
];

// ─── Store ───────────────────────────────────────────────────────────────
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      users: initialUsers,
      catalogs: initialCatalogs,
      auditLogs: initialAuditLogs,
      loading: false,

      // ── User Management ──────────────────────────────
      addUser: (userData) => set((state) => ({
        users: [{ 
          ...userData, 
          id: crypto.randomUUID(), 
          active: true 
        }, ...state.users],
        auditLogs: [{
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          user: 'Sistema',
          action: `Creó usuario ${userData.name}`,
          module: 'Configuración'
        }, ...state.auditLogs]
      })),

      toggleUserInit: (userId) => set((state) => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, active: !u.active } : u
        )
      })),

      // ── Audit Logging ────────────────────────────────
      addAuditLog: (user, action, module) => set((state) => ({
        auditLogs: [{
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          user,
          action,
          module
        }, ...state.auditLogs].slice(0, 200) // Keep last 200 logs
      })),

      // ── Data Export ──────────────────────────────────
      exportData: () => {
        const state = get();
        const blob = new Blob([JSON.stringify({
          users: state.users,
          catalogs: state.catalogs,
          auditLogs: state.auditLogs,
          exportDate: new Date().toISOString()
        }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cmms_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      // ── Factory Reset ────────────────────────────────
      resetDatabase: () => {
        // Clear EVERYTHING in localStorage for a true factory reset
        localStorage.clear();
        window.location.reload();
      },

      // ── Theme Management ─────────────────────────────
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      })
    }),
    {
      name: 'cmms-settings',
      partialize: (state) => ({
        theme: state.theme,
        users: state.users,
        catalogs: state.catalogs,
        auditLogs: state.auditLogs,
      })
    }
  )
);
