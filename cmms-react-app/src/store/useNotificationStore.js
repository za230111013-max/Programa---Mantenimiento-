import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialNotifications = [
  {
    id: 'notif-tesla',
    title: 'Actualización Tesla Giga Factory',
    message: 'Nuevos parámetros de torque para la línea de ensamble Model 3 sincronizados exitosamente.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    read: false
  },
  {
    id: 'notif-volvo',
    title: 'Mantenimiento Volvo Trucks',
    message: 'Brazo robótico de pintura requiere cambio de filtros de aire en 24 horas.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 3600 * 3).toISOString(), // 3 hours ago
    read: false
  },
  {
    id: 'notif-1',
    title: 'Alerta Crítica: CNC-03',
    message: 'Nivel de vibración excedió el umbral (8.2 mm/s). Se recomienda inspección inmediata.',
    type: 'error',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false
  },
  {
    id: 'notif-2',
    title: 'SLA Vencido: OT-2024001',
    message: 'La orden de trabajo para Bomba BMB-01 ha superado el tiempo de respuesta permitido.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false
  },
  {
    id: 'notif-3',
    title: 'Stock Bajo: Rodamiento 6205',
    message: 'Quedan solo 2 unidades en almacén. Nivel de reorden alcanzado.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    read: true
  },
  {
    id: 'notif-4',
    title: 'Preventivo Generado',
    message: 'Se ha creado automáticamente la OT para el Chiller-08 según el plan mensual.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    read: true
  }
];

export const useNotificationStore = create(
  persist(
    (set) => ({
      notifications: initialNotifications,
      addNotification: (notification) => set((state) => ({
        notifications: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        }, ...state.notifications].slice(0, 50)
      })),
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      markRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => 0
    }),
    { name: 'cmms-notifications', partialize: (state) => ({ notifications: state.notifications }) }
  )
);
