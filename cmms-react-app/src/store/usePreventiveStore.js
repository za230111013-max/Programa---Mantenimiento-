import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialPlans = [
  { id: '1', assetId: 'BMB-01', name: 'Lubricación de Motor de Bomba', type: 'tiempo', intervalDays: 30, nextDueDate: '2024-05-15', compliance: 95, estimatedHours: 2.5, requiredParts: [{ id: 'part_001', name: 'Grasa Industrial', qty: 1 }], checklist: ['Limpiar boquillas', 'Aplicar grasa SKF-22', 'Verificar temperatura de baleros'] },
  { id: '2', assetId: 'CNC-03', name: 'Mantenimiento Preventivo Trimestral', type: 'uso', intervalHours: 500, nextDueHours: 1200, compliance: 88, estimatedHours: 6, requiredParts: [{ id: 'part_002', name: 'Filtro Hidráulico', qty: 2 }, { id: 'part_003', name: 'Aceite ISO-68', qty: 5 }], checklist: ['Retirar filtros usados', 'Limpiar cuba de sedimentos', 'Instalar nuevos filtros', 'Rellenar aceite'] },
  { id: '3', assetId: 'COMP-02', name: 'Revisión de Fugas y Presión', type: 'tiempo', intervalDays: 15, nextDueDate: '2024-04-30', compliance: 100, estimatedHours: 1, requiredParts: [], checklist: ['Inspeccionar mangueras', 'Escuchar fugas de aire', 'Limpiar purgador'] },
  { id: '4', assetId: 'MV-04', name: 'Limpieza de Aspas y Balanceo', type: 'tiempo', intervalDays: 30, nextDueDate: '2024-05-10', compliance: 92, estimatedHours: 2, requiredParts: [], checklist: ['Retirar polvo acumulado', 'Verificar balanceo estático', 'Comprobar consumo eléctrico'] },
  { id: '5', assetId: 'CONV-05', name: 'Alineación y Tensión de Banda', type: 'tiempo', intervalDays: 7, nextDueDate: '2024-04-25', compliance: 98, estimatedHours: 1.5, requiredParts: [], checklist: ['Verificar centrado de banda', 'Ajustar tensores laterales', 'Inspeccionar grapas de unión'] },
  { id: '6', assetId: 'CHILLER-08', name: 'Limpieza Química de Condensador', type: 'tiempo', intervalDays: 30, nextDueDate: '2024-05-20', compliance: 85, estimatedHours: 4, requiredParts: [{ id: 'part_004', name: 'Líquido Desincrustante', qty: 1 }], checklist: ['Drenar circuito', 'Aplicar químico recirculante', 'Enjuagar y neutralizar', 'Verificar presiones'] },
  { id: '7', assetId: 'PRENSA-09', name: 'Revisión Sistema Hidráulico', type: 'uso', intervalHours: 1000, nextDueHours: 4800, compliance: 90, estimatedHours: 8, requiredParts: [{ id: 'part_005', name: 'Empaque de Pistón Principal', qty: 1 }], checklist: ['Cambio de sellos', 'Prueba de presión máxima', 'Purgado de aire', 'Limpieza de válvulas'] },
  { id: '8', assetId: 'MONT-10', name: 'Servicio de Motor y Cadena', type: 'uso', intervalHours: 250, nextDueHours: 6450, compliance: 100, estimatedHours: 3, requiredParts: [{ id: 'part_006', name: 'Filtro de Aceite', qty: 1 }], checklist: ['Cambio de aceite', 'Lubricar cadena de mástil', 'Revisar espesor de horquillas'] },
  { id: '9', assetId: 'GEN-11', name: 'Prueba de Operación Mensual', type: 'tiempo', intervalDays: 30, nextDueDate: '2024-05-01', compliance: 100, estimatedHours: 1.5, requiredParts: [], checklist: ['Prueba de arranque en frío', 'Medición de frecuencia y voltaje', 'Verificar nivel de diésel'] },
  { id: '10', assetId: 'UPS-13', name: 'Descarga Controlada de Baterías', type: 'tiempo', intervalDays: 180, nextDueDate: '2024-09-10', compliance: 100, estimatedHours: 2, requiredParts: [], checklist: ['Simular corte de energía', 'Monitorear curva de descarga', 'Verificar alarmas de sistema'] }
];

export const usePreventiveStore = create(
  persist(
    (set, get) => ({
      plans: initialPlans,

      createPlan: (data) => set((state) => ({
        plans: [{ ...data, id: crypto.randomUUID(), compliance: 100 }, ...state.plans]
      })),

      executePlan: (planId) => {
        const plans = get().plans;
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const updatedPlans = plans.map(p => {
          if (p.id === planId) {
            if (p.type === 'tiempo') {
              const nextDate = new Date(p.nextDueDate);
              nextDate.setDate(nextDate.getDate() + (parseInt(p.intervalDays) || 30));
              return { ...p, nextDueDate: nextDate.toISOString().split('T')[0] };
            } else {
              return { ...p, nextDueHours: p.nextDueHours + (parseInt(p.intervalHours) || 500) };
            }
          }
          return p;
        });

        set({ plans: updatedPlans });
        return plan;
      },

      // ── Auto-generate WOs for overdue plans ─────────────
      checkAndGenerateWOs: (assetsStore, ordersStore) => {
        const plans = get().plans;
        const now = new Date();
        const generated = [];

        plans.forEach(plan => {
          let isOverdue = false;

          if (plan.type === 'tiempo') {
            const dueDate = new Date(plan.nextDueDate);
            isOverdue = dueDate <= now;
          } else if (plan.type === 'uso') {
            const asset = assetsStore?.assets?.find(a => a.tag === plan.assetId);
            if (asset && asset.currentHours >= plan.nextDueHours) {
              isOverdue = true;
            }
          }

          if (isOverdue) {
            // Create preventive work order
            const newOrder = {
              title: `PM - ${plan.name}`,
              description: `Orden generada automáticamente por plan preventivo vencido. Checklist: ${plan.checklist.join(', ')}`,
              assetTag: plan.assetId,
              priority: 'P3',
              type: 'preventivo',
              area: 'Mantenimiento',
              estimatedHours: plan.estimatedHours,
              checklist: plan.checklist.map(task => ({ task, completed: false })),
              planId: plan.id
            };

            ordersStore?.createOrder(newOrder);
            generated.push(plan.name);

            // Advance the plan to next due date/hours
            get().executePlan(plan.id);
          }
        });

        return generated;
      }
    }),
    { name: 'cmms-preventive', partialize: (state) => ({ plans: state.plans }) }
  )
);
