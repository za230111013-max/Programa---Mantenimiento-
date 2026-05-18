import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SLA_HOURS = { P1: 2, P2: 8, P3: 24, P4: 72 };
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();
let folioCounter = parseInt(localStorage.getItem('cmms_folio_counter') || '100', 10);

const initialOrders = [
  { id: 'ot_001', folio: 'OT-2024001', title: 'Fuga de aceite en sello mecánico', priority: 'P2', status: 'abierta', assetTag: 'BMB-01', createdAt: daysAgo(1), type: 'correctivo', failureCause: 'Desgaste de sello', area: 'Producción', createdBy: 'Admin' },
  { id: 'ot_002', folio: 'OT-2024002', title: 'Vibración excesiva en husillo', priority: 'P1', status: 'en_proceso', assetTag: 'CNC-03', createdAt: daysAgo(0, 12), type: 'emergencia', failureCause: 'Rodamiento dañado', area: 'Maquinado', createdBy: 'Admin' },
  { id: 'ot_003', folio: 'OT-2024003', title: 'PM - Cambio de filtros compresor', priority: 'P3', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(3), closedAt: daysAgo(2, 20), repairHours: 1.5, type: 'preventivo', failureCause: null, area: 'Servicios', createdBy: 'Sistema' },
  { id: 'ot_004', folio: 'OT-2024004', title: 'Alineación de bomba', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(6), closedAt: daysAgo(5, 16), repairHours: 3.0, type: 'correctivo', failureCause: 'Desalineación', area: 'Producción', createdBy: 'Admin' },
  { id: 'ot_101', folio: 'OT-2024101', title: 'Ruido anormal en rodamiento', priority: 'P2', status: 'abierta', assetTag: 'CHILLER-08', createdAt: daysAgo(0, 2), type: 'correctivo', area: 'Servicios', createdBy: 'Supervisor de Planta' },
  { id: 'ot_102', folio: 'OT-2024102', title: 'Goteo en manguera hidráulica', priority: 'P1', status: 'abierta', assetTag: 'PRENSA-09', createdAt: daysAgo(0, 4), type: 'emergencia', area: 'Producción', createdBy: 'Técnico de Guardia' },
  { id: 'ot_103', folio: 'OT-2024103', title: 'Falla en luces de reversa', priority: 'P3', status: 'abierta', assetTag: 'MONT-10', createdAt: daysAgo(1), type: 'mejora', area: 'Almacén', createdBy: 'Admin' },
  { id: 'ot_201', folio: 'OT-2024201', title: 'Overhaul de cabezal principal', priority: 'P1', status: 'en_proceso', assetTag: 'CNC-03', createdAt: daysAgo(2), type: 'mejora', area: 'Maquinado', createdBy: 'Admin' },
  { id: 'ot_202', folio: 'OT-2024202', title: 'Servicio mayor de motor diésel', priority: 'P2', status: 'en_proceso', assetTag: 'GEN-11', createdAt: daysAgo(1, 10), type: 'preventivo', area: 'Servicios', createdBy: 'Supervisor de Planta' },
  { id: 'ot_203', folio: 'OT-2024203', title: 'Pruebas de conductividad banco baterías', priority: 'P3', status: 'en_proceso', assetTag: 'UPS-13', createdAt: daysAgo(1, 5), type: 'predictivo', area: 'Servicios', createdBy: 'Técnico de Guardia' },
  { id: 'ot_005', folio: 'OT-2024005', title: 'PM - Lubricación chumaceras CNC', priority: 'P4', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(8), closedAt: daysAgo(7), repairHours: 0.5, type: 'preventivo', failureCause: null, area: 'Maquinado' },
  { id: 'ot_006', folio: 'OT-2024006', title: 'Reemplazo contactor quemado', priority: 'P2', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(10), closedAt: daysAgo(9, 14), repairHours: 2.5, type: 'correctivo', failureCause: 'Sobrecarga eléctrica', area: 'Producción' },
  { id: 'ot_007', folio: 'OT-2024007', title: 'Ruido anormal en compresor', priority: 'P2', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(12), closedAt: daysAgo(11, 10), repairHours: 4.0, type: 'correctivo', failureCause: 'Banda desgastada', area: 'Servicios' },
  { id: 'ot_008', folio: 'OT-2024008', title: 'PM - Inspección general bomba', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(15), closedAt: daysAgo(14), repairHours: 2.0, type: 'preventivo', failureCause: null, area: 'Producción' },
  { id: 'ot_009', folio: 'OT-2024009', title: 'Falla de variador de frecuencia', priority: 'P1', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(35), closedAt: daysAgo(34, 8), repairHours: 6.0, type: 'emergencia', failureCause: 'Falla electrónica', area: 'Producción' },
  { id: 'ot_010', folio: 'OT-2024010', title: 'PM - Cambio aceite hidráulico', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(38), closedAt: daysAgo(37), repairHours: 3.0, type: 'preventivo', failureCause: null, area: 'Producción' },
  { id: 'ot_011', folio: 'OT-2024011', title: 'Fuga neumática en línea principal', priority: 'P2', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(40), closedAt: daysAgo(39, 14), repairHours: 1.5, type: 'correctivo', failureCause: 'Conexión floja', area: 'Servicios' },
  { id: 'ot_012', folio: 'OT-2024012', title: 'Calibración de herramienta CNC', priority: 'P3', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(42), closedAt: daysAgo(41), repairHours: 2.0, type: 'preventivo', failureCause: null, area: 'Maquinado' },
  { id: 'ot_013', folio: 'OT-2024013', title: 'Sobrecalentamiento motor bomba', priority: 'P1', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(45), closedAt: daysAgo(44, 6), repairHours: 8.0, type: 'emergencia', failureCause: 'Rodamiento dañado', area: 'Producción' },
  { id: 'ot_014', folio: 'OT-2024014', title: 'PM - Tensión de bandas compresor', priority: 'P4', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(48), closedAt: daysAgo(47), repairHours: 1.0, type: 'preventivo', failureCause: null, area: 'Servicios' },
  { id: 'ot_015', folio: 'OT-2024015', title: 'Error de posicionamiento en eje X', priority: 'P2', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(50), closedAt: daysAgo(49, 16), repairHours: 5.0, type: 'correctivo', failureCause: 'Encoder dañado', area: 'Maquinado' },
  { id: 'ot_016', folio: 'OT-2024016', title: 'PM - Limpieza tablero eléctrico', priority: 'P4', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(65), closedAt: daysAgo(64), repairHours: 1.5, type: 'preventivo', failureCause: null, area: 'Producción' },
  { id: 'ot_017', folio: 'OT-2024017', title: 'Rotura de banda transmisión', priority: 'P1', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(68), closedAt: daysAgo(67, 10), repairHours: 3.0, type: 'emergencia', failureCause: 'Fatiga de material', area: 'Servicios' },
  { id: 'ot_018', folio: 'OT-2024018', title: 'Ajuste de parámetros servo CNC', priority: 'P3', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(70), closedAt: daysAgo(69), repairHours: 2.0, type: 'correctivo', failureCause: 'Deriva de parámetros', area: 'Maquinado' },
  { id: 'ot_019', folio: 'OT-2024019', title: 'PM - Engrase de rodamientos', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(75), closedAt: daysAgo(74), repairHours: 1.0, type: 'preventivo', failureCause: null, area: 'Producción' },
  { id: 'ot_020', folio: 'OT-2024020', title: 'Válvula de alivio defectuosa', priority: 'P2', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(78), closedAt: daysAgo(77, 12), repairHours: 4.0, type: 'correctivo', failureCause: 'Desgaste mecánico', area: 'Producción' },
  { id: 'ot_021', folio: 'OT-2024021', title: 'Presión baja en sistema neumático', priority: 'P2', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(80), closedAt: daysAgo(79, 8), repairHours: 2.5, type: 'correctivo', failureCause: 'Filtro saturado', area: 'Servicios' },
  { id: 'ot_022', folio: 'OT-2024022', title: 'PM - Revisión anual de bomba', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(95), closedAt: daysAgo(93), repairHours: 8.0, type: 'preventivo', failureCause: null, area: 'Producción' },
  { id: 'ot_023', folio: 'OT-2024023', title: 'Cortocircuito en panel de control', priority: 'P1', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(98), closedAt: daysAgo(97, 4), repairHours: 12.0, type: 'emergencia', failureCause: 'Cortocircuito', area: 'Maquinado' },
  { id: 'ot_024', folio: 'OT-2024024', title: 'Reemplazo de empaque de bomba', priority: 'P3', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(102), closedAt: daysAgo(101, 16), repairHours: 3.5, type: 'correctivo', failureCause: 'Empaque deteriorado', area: 'Producción' },
  { id: 'ot_025', folio: 'OT-2024025', title: 'PM - Cambio filtros aceite CNC', priority: 'P4', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(105), closedAt: daysAgo(104), repairHours: 1.5, type: 'preventivo', failureCause: null, area: 'Maquinado' },
  { id: 'ot_026', folio: 'OT-2024026', title: 'Temperatura alta en compresor', priority: 'P2', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(110), closedAt: daysAgo(109, 10), repairHours: 4.0, type: 'correctivo', failureCause: 'Radiador obstruido', area: 'Servicios' },
  { id: 'ot_027', folio: 'OT-2024027', title: 'PM - Mantenimiento preventivo anual', priority: 'P3', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(130), closedAt: daysAgo(128), repairHours: 6.0, type: 'preventivo', failureCause: null, area: 'Servicios' },
  { id: 'ot_028', folio: 'OT-2024028', title: 'Falla en sistema de refrigeración CNC', priority: 'P1', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(135), closedAt: daysAgo(134, 6), repairHours: 10.0, type: 'emergencia', failureCause: 'Bomba de refrigerante', area: 'Maquinado' },
  { id: 'ot_029', folio: 'OT-2024029', title: 'Desgaste de impeller bomba', priority: 'P2', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(140), closedAt: daysAgo(138), repairHours: 12.0, type: 'correctivo', failureCause: 'Erosión por cavitación', area: 'Producción' },
  { id: 'ot_030', folio: 'OT-2024030', title: 'PM - Inspección eléctrica compresor', priority: 'P4', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(145), closedAt: daysAgo(144), repairHours: 2.0, type: 'preventivo', failureCause: null, area: 'Servicios' },
  { id: 'ot_031', folio: 'OT-2024031', title: 'PM - Calibración sensores CNC', priority: 'P3', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(160), closedAt: daysAgo(159), repairHours: 2.0, type: 'preventivo', failureCause: null, area: 'Maquinado' },
  { id: 'ot_032', folio: 'OT-2024032', title: 'Fuga interna en cilindro hidráulico', priority: 'P2', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(165), closedAt: daysAgo(163, 8), repairHours: 6.0, type: 'correctivo', failureCause: 'Sellos internos', area: 'Producción' },
  { id: 'ot_033', folio: 'OT-2024033', title: 'Reemplazo válvula solenoide', priority: 'P3', status: 'cerrada', assetTag: 'COMP-02', createdAt: daysAgo(170), closedAt: daysAgo(169, 14), repairHours: 2.5, type: 'correctivo', failureCause: 'Válvula atascada', area: 'Servicios' },
  { id: 'ot_034', folio: 'OT-2024034', title: 'PM - Cambio de aceite CNC', priority: 'P4', status: 'cerrada', assetTag: 'CNC-03', createdAt: daysAgo(175), closedAt: daysAgo(174), repairHours: 1.5, type: 'preventivo', failureCause: null, area: 'Maquinado' },
  { id: 'ot_035', folio: 'OT-2024035', title: 'Alarma de sobrecarga motor', priority: 'P1', status: 'cerrada', assetTag: 'BMB-01', createdAt: daysAgo(178), closedAt: daysAgo(177, 4), repairHours: 5.0, type: 'emergencia', failureCause: 'Rodamiento dañado', area: 'Producción' },
];

export const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: initialOrders,
      createOrder: (newOrder) => set((state) => {
        folioCounter++;
        localStorage.setItem('cmms_folio_counter', folioCounter.toString());
        const year = new Date().getFullYear();
        const hours = SLA_HOURS[newOrder.priority] || 24;
        const dueDate = new Date(Date.now() + 3600000 * hours).toISOString();
        return {
          orders: [{
            ...newOrder,
            id: crypto.randomUUID(),
            folio: `OT-${year}-${String(folioCounter).padStart(4, '0')}`,
            createdAt: new Date().toISOString(),
            dueDate,
            status: 'abierta',
            createdBy: newOrder.createdBy || 'Sistema'
          }, ...state.orders]
        };
      }),
      updateOrderStatus: (id, newStatus, closureData = null) => set((state) => ({
        orders: state.orders.map(o => {
          if (o.id === id) {
            return {
              ...o, status: newStatus,
              ...(closureData ? {
                closureNotes: closureData.notes, closedAt: new Date().toISOString(),
                repairHours: closureData.repairHours || 0, failureCause: closureData.failureCause,
                rootCause: closureData.rootCause, closure: closureData
              } : {})
            };
          }
          return o;
        })
      })),
      getFailureSolutions: (assetTag) => {
        const orders = get().orders;
        const history = orders.filter(o => o.assetTag === assetTag && o.status === 'cerrada' && o.failureCause);
        const solutions = {};
        history.forEach(o => {
          if (!solutions[o.failureCause]) {
            solutions[o.failureCause] = { count: 0, rootCauses: new Set(), avgRepairHours: 0, totalRepairHours: 0 };
          }
          solutions[o.failureCause].count++;
          o.rootCause?.forEach(rc => solutions[o.failureCause].rootCauses.add(rc));
          solutions[o.failureCause].totalRepairHours += (o.repairHours || 0);
          solutions[o.failureCause].avgRepairHours = solutions[o.failureCause].totalRepairHours / solutions[o.failureCause].count;
        });
        return Object.entries(solutions).map(([cause, data]) => ({
          cause, count: data.count, suggestedActions: Array.from(data.rootCauses).slice(0, 3),
          avgTime: data.avgRepairHours.toFixed(1)
        })).sort((a, b) => b.count - a.count);
      },
      getEscalatedCount: () => {
        const now = new Date();
        return get().orders.filter(o => o.status !== 'cerrada' && o.dueDate && new Date(o.dueDate) < now).length;
      }
    }),
    { name: 'cmms-orders', partialize: (state) => ({ orders: state.orders }) }
  )
);
