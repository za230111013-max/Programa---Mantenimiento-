import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Datos Iniciales Enriquecidos ────────────────────────────────────────

const initialInventoryItems = [
  // Rodamientos
  { id: 'inv_001', code: 'ROD-6205-2RS', name: 'Rodamiento 6205-2RS Sellado', category: 'Rodamientos', unit: 'pza', currentStock: 12, minStock: 4, maxStock: 30, reorderPoint: 8, unitCost: 150.0, location: 'A1-01', supplier: 'SKF de México', compatibleAssets: ['BMB-01', 'CNC-03'] },
  { id: 'inv_002', code: 'ROD-6308-ZZ', name: 'Rodamiento 6308-ZZ Blindado', category: 'Rodamientos', unit: 'pza', currentStock: 3, minStock: 4, maxStock: 20, reorderPoint: 6, unitCost: 280.0, location: 'A1-02', supplier: 'SKF de México', compatibleAssets: ['BMB-01'] },
  { id: 'inv_003', code: 'ROD-NUP310', name: 'Rodamiento Cilíndrico NUP310', category: 'Rodamientos', unit: 'pza', currentStock: 1, minStock: 2, maxStock: 10, reorderPoint: 3, unitCost: 920.0, location: 'A1-03', supplier: 'FAG Schaeffler', compatibleAssets: ['CNC-03'] },

  // Filtros
  { id: 'inv_004', code: 'FLT-AIRE-01', name: 'Filtro de Aire Compresor Atlas', category: 'Filtros', unit: 'pza', currentStock: 2, minStock: 5, maxStock: 20, reorderPoint: 7, unitCost: 850.0, location: 'B2-10', supplier: 'Compresores del Norte', compatibleAssets: ['COMP-02'] },
  { id: 'inv_005', code: 'FLT-ACEIT-03', name: 'Filtro de Aceite Hidráulico', category: 'Filtros', unit: 'pza', currentStock: 6, minStock: 3, maxStock: 15, reorderPoint: 5, unitCost: 420.0, location: 'B2-11', supplier: 'Parker Hannifin', compatibleAssets: ['BMB-01'] },

  // Bandas
  { id: 'inv_006', code: 'BND-A34', name: 'Banda en V Perfil A-34', category: 'Bandas', unit: 'pza', currentStock: 8, minStock: 10, maxStock: 40, reorderPoint: 15, unitCost: 85.0, location: 'C1-05', supplier: 'Gates Power', compatibleAssets: ['COMP-02', 'BMB-01'] },
  { id: 'inv_007', code: 'BND-5VX800', name: 'Banda Dentada 5VX800', category: 'Bandas', unit: 'pza', currentStock: 0, minStock: 2, maxStock: 10, reorderPoint: 4, unitCost: 340.0, location: 'C1-06', supplier: 'Gates Power', compatibleAssets: ['CNC-03'] },

  // Eléctrico
  { id: 'inv_008', code: 'CNT-ABB-24', name: 'Contactor Tripolar 24VDC ABB', category: 'Eléctrico', unit: 'pza', currentStock: 45, minStock: 5, maxStock: 60, reorderPoint: 10, unitCost: 450.0, location: 'D4-12', supplier: 'ABB Componentes', compatibleAssets: ['BMB-01', 'COMP-02', 'CNC-03'] },
  { id: 'inv_009', code: 'FUS-NH-100', name: 'Fusible NH Talla 1 100A', category: 'Eléctrico', unit: 'pza', currentStock: 18, minStock: 6, maxStock: 50, reorderPoint: 12, unitCost: 95.0, location: 'D4-15', supplier: 'Siemens', compatibleAssets: ['BMB-01', 'CNC-03'] },
  { id: 'inv_010', code: 'VFD-ABB-5HP', name: 'Variador de Frecuencia 5HP', category: 'Eléctrico', unit: 'pza', currentStock: 1, minStock: 1, maxStock: 3, reorderPoint: 1, unitCost: 8500.0, location: 'D5-01', supplier: 'ABB Componentes', compatibleAssets: ['BMB-01'] },

  // Lubricantes
  { id: 'inv_011', code: 'LUB-MOBIL68', name: 'Aceite Hidráulico Mobil DTE 68', category: 'Lubricantes', unit: 'cubeta', currentStock: 4, minStock: 2, maxStock: 10, reorderPoint: 3, unitCost: 1800.0, location: 'E1-01', supplier: 'Mobil Industrial', compatibleAssets: ['BMB-01'] },
  { id: 'inv_012', code: 'GRS-SKF-LGMT', name: 'Grasa SKF LGMT 2/1', category: 'Lubricantes', unit: 'kit', currentStock: 7, minStock: 3, maxStock: 15, reorderPoint: 5, unitCost: 350.0, location: 'E1-05', supplier: 'SKF de México', compatibleAssets: ['BMB-01', 'COMP-02', 'CNC-03'] },

  // Sellos y Empaques
  { id: 'inv_013', code: 'SLL-VIT-38', name: 'Sello Mecánico Vitón 38mm', category: 'Sellos', unit: 'pza', currentStock: 2, minStock: 3, maxStock: 12, reorderPoint: 4, unitCost: 1250.0, location: 'F2-03', supplier: 'John Crane', compatibleAssets: ['BMB-01'] },
  { id: 'inv_014', code: 'ORG-NBR-KIT', name: 'Kit O-Rings NBR Multitamaño', category: 'Sellos', unit: 'kit', currentStock: 5, minStock: 2, maxStock: 8, reorderPoint: 3, unitCost: 180.0, location: 'F2-05', supplier: 'Parker Hannifin', compatibleAssets: ['BMB-01', 'COMP-02'] },

  // Herramientas
  { id: 'inv_015', code: 'HRR-TORQ-01', name: 'Torquímetro Digital 10-200 Nm', category: 'Herramientas', unit: 'pza', currentStock: 2, minStock: 1, maxStock: 3, reorderPoint: 1, unitCost: 3200.0, location: 'G1-01', supplier: 'Proto Industrial', compatibleAssets: [] },
  { id: 'inv_016', code: 'HRR-EXTR-01', name: 'Extractor de Rodamientos Hidráulico', category: 'Herramientas', unit: 'pza', currentStock: 1, minStock: 1, maxStock: 2, reorderPoint: 1, unitCost: 4500.0, location: 'G1-02', supplier: 'SKF de México', compatibleAssets: [] },
];

// Movimientos de ejemplo pre-cargados
const initialMovements = [
  { id: 'mov_001', partId: 'inv_004', partCode: 'FLT-AIRE-01', partName: 'Filtro de Aire Compresor Atlas', type: 'salida', quantity: 2, reason: 'consumo_ot', notes: 'Cambio programado PM', orderId: 'OT-2024001', assetTag: 'COMP-02', user: 'Supervisor de Planta', previousStock: 4, newStock: 2, date: new Date(Date.now() - 172800000).toISOString() },
  { id: 'mov_002', partId: 'inv_001', partCode: 'ROD-6205-2RS', partName: 'Rodamiento 6205-2RS Sellado', type: 'salida', quantity: 2, reason: 'consumo_ot', notes: 'Reemplazo por ruido', orderId: 'OT-2024002', assetTag: 'CNC-03', user: 'Técnico de Guardia', previousStock: 14, newStock: 12, date: new Date(Date.now() - 259200000).toISOString() },
  { id: 'mov_003', partId: 'inv_006', partCode: 'BND-A34', partName: 'Banda en V Perfil A-34', type: 'salida', quantity: 2, reason: 'consumo_ot', notes: 'Banda desgastada', orderId: 'OT-2024003', assetTag: 'COMP-02', user: 'Técnico de Guardia', previousStock: 10, newStock: 8, date: new Date(Date.now() - 345600000).toISOString() },
  { id: 'mov_004', partId: 'inv_008', partCode: 'CNT-ABB-24', partName: 'Contactor Tripolar 24VDC ABB', type: 'entrada', quantity: 10, reason: 'compra', notes: 'Factura FAC-2024-0089', orderId: null, assetTag: null, user: 'Administrador', previousStock: 35, newStock: 45, date: new Date(Date.now() - 432000000).toISOString() },
  { id: 'mov_005', partId: 'inv_011', partCode: 'LUB-MOBIL68', partName: 'Aceite Hidráulico Mobil DTE 68', type: 'salida', quantity: 1, reason: 'consumo_ot', notes: 'Relleno de tanque hidráulico', orderId: 'OT-2024001', assetTag: 'BMB-01', user: 'Técnico de Guardia', previousStock: 5, newStock: 4, date: new Date(Date.now() - 518400000).toISOString() },
  { id: 'mov_006', partId: 'inv_013', partCode: 'SLL-VIT-38', partName: 'Sello Mecánico Vitón 38mm', type: 'salida', quantity: 1, reason: 'consumo_ot', notes: 'Fuga en sello primario', orderId: 'OT-2024001', assetTag: 'BMB-01', user: 'Supervisor de Planta', previousStock: 3, newStock: 2, date: new Date(Date.now() - 604800000).toISOString() },
  { id: 'mov_007', partId: 'inv_012', partCode: 'GRS-SKF-LGMT', partName: 'Grasa SKF LGMT 2/1', type: 'salida', quantity: 1, reason: 'consumo_ot', notes: 'Lubricación de chumaceras', orderId: 'OT-2024003', assetTag: 'CMP-02', user: 'Técnico de Guardia', previousStock: 8, newStock: 7, date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'mov_008', partId: 'inv_007', partCode: 'BND-5VX800', partName: 'Banda Dentada 5VX800', type: 'salida', quantity: 1, reason: 'consumo_ot', notes: 'Reemplazo emergencia', orderId: 'OT-2024002', assetTag: 'CNC-03', user: 'Técnico de Guardia', previousStock: 1, newStock: 0, date: new Date(Date.now() - 43200000).toISOString() },
];

// ─── Store ────────────────────────────────────────────────────────────────

export const useInventoryStore = create(
  persist(
    (set, get) => ({
  items: initialInventoryItems,
  movements: initialMovements,

  // ── CRUD ──────────────────────────────────────────
  addPart: (partData) => set((state) => ({
    items: [{ ...partData, id: crypto.randomUUID(), compatibleAssets: partData.compatibleAssets || [] }, ...state.items]
  })),

  updatePart: (id, updates) => set((state) => ({
    items: state.items.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deletePart: (id) => set((state) => ({
    items: state.items.filter(p => p.id !== id)
  })),

  updateStockLevels: (id, { minStock, maxStock, reorderPoint }) => set((state) => ({
    items: state.items.map(p => p.id === id ? { ...p, minStock, maxStock, reorderPoint } : p)
  })),

  // ── Movimientos ───────────────────────────────────
  recordMovement: (partId, type, quantity, reason, notes, user, orderId = null, assetTag = null) => set((state) => {
    const part = state.items.find(p => p.id === partId);
    if (!part) return state;

    const previousStock = part.currentStock;
    const newStock = type === 'entrada' ? previousStock + quantity : previousStock - quantity;

    const items = state.items.map(p =>
      p.id === partId ? { ...p, currentStock: Math.max(0, newStock) } : p
    );

    const movement = {
      id: crypto.randomUUID(),
      partId,
      partCode: part.code,
      partName: part.name,
      type,
      quantity,
      reason,
      notes,
      orderId,
      assetTag,
      user: user || 'Sistema',
      previousStock,
      newStock: Math.max(0, newStock),
      date: new Date().toISOString()
    };

    return { items, movements: [movement, ...state.movements] };
  }),

  consumeForOrder: (partId, quantity, orderId, assetTag, notes, user) => {
    get().recordMovement(partId, 'salida', quantity, 'consumo_ot', notes || `Consumo OT ${orderId}`, user, orderId, assetTag);
  },

  // ── Selectores Básicos ────────────────────────────
  getLowStockItems: () => get().items.filter(item => item.currentStock <= item.minStock),

  getTotalInventoryValue: () => get().items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0),

  getCategories: () => [...new Set(get().items.map(item => item.category))],

  // ── Selectores de Reorden ─────────────────────────
  getReorderAlerts: () => {
    return get().items
      .filter(item => item.currentStock <= item.reorderPoint)
      .map(item => {
        let severity = 'low';   // stock <= minStock
        let color = 'yellow';
        if (item.currentStock === 0) { severity = 'critical'; color = 'red'; }
        else if (item.currentStock <= Math.floor(item.reorderPoint * 0.5)) { severity = 'urgent'; color = 'orange'; }

        const qtyToReorder = item.maxStock - item.currentStock;
        const estimatedCost = qtyToReorder * item.unitCost;

        return { ...item, severity, color, qtyToReorder, estimatedCost };
      })
      .sort((a, b) => {
        const order = { critical: 0, urgent: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      });
  },

  // ── Selectores de Activos ─────────────────────────
  getPartsByAsset: (assetTag) => {
    return get().items.filter(item =>
      item.compatibleAssets && item.compatibleAssets.includes(assetTag)
    );
  },

  getAssetPartsSummary: () => {
    const items = get().items;
    const assetMap = {};

    items.forEach(item => {
      (item.compatibleAssets || []).forEach(tag => {
        if (!assetMap[tag]) {
          assetMap[tag] = { assetTag: tag, parts: [], totalValue: 0, alertCount: 0 };
        }
        assetMap[tag].parts.push(item);
        assetMap[tag].totalValue += item.currentStock * item.unitCost;
        if (item.currentStock <= item.reorderPoint) {
          assetMap[tag].alertCount++;
        }
      });
    });

    return Object.values(assetMap).sort((a, b) => b.alertCount - a.alertCount);
  },

  // ── Selectores de Consumo por OT ──────────────────
  getConsumptionByOrder: () => {
    const movements = get().movements.filter(m => m.reason === 'consumo_ot' && m.orderId);
    const orderMap = {};

    movements.forEach(mov => {
      if (!orderMap[mov.orderId]) {
        orderMap[mov.orderId] = {
          orderId: mov.orderId,
          assetTag: mov.assetTag,
          items: [],
          totalCost: 0,
          totalParts: 0,
          lastDate: mov.date
        };
      }
      const part = get().items.find(p => p.id === mov.partId);
      const cost = (part?.unitCost || 0) * mov.quantity;
      orderMap[mov.orderId].items.push({
        ...mov,
        unitCost: part?.unitCost || 0,
        totalCost: cost
      });
      orderMap[mov.orderId].totalCost += cost;
      orderMap[mov.orderId].totalParts += mov.quantity;
      if (new Date(mov.date) > new Date(orderMap[mov.orderId].lastDate)) {
        orderMap[mov.orderId].lastDate = mov.date;
      }
    });

    return Object.values(orderMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
  },

  getConsumptionStats: () => {
    const movements = get().movements.filter(m => m.reason === 'consumo_ot');
    const items = get().items;

    // Top consumidos
    const partConsumption = {};
    movements.forEach(mov => {
      if (!partConsumption[mov.partId]) {
        const part = items.find(p => p.id === mov.partId);
        partConsumption[mov.partId] = {
          partId: mov.partId,
          partCode: mov.partCode,
          partName: mov.partName,
          category: part?.category || 'N/A',
          totalQty: 0,
          totalCost: 0,
          timesUsed: 0
        };
      }
      const part = items.find(p => p.id === mov.partId);
      partConsumption[mov.partId].totalQty += mov.quantity;
      partConsumption[mov.partId].totalCost += mov.quantity * (part?.unitCost || 0);
      partConsumption[mov.partId].timesUsed += 1;
    });

    const topConsumed = Object.values(partConsumption)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 8);

    // Costo por categoría
    const categoryBreakdown = {};
    Object.values(partConsumption).forEach(pc => {
      if (!categoryBreakdown[pc.category]) {
        categoryBreakdown[pc.category] = { category: pc.category, totalCost: 0, totalQty: 0 };
      }
      categoryBreakdown[pc.category].totalCost += pc.totalCost;
      categoryBreakdown[pc.category].totalQty += pc.totalQty;
    });

    const totalConsumptionCost = movements.reduce((sum, mov) => {
      const part = items.find(p => p.id === mov.partId);
      return sum + (mov.quantity * (part?.unitCost || 0));
    }, 0);

    return {
      topConsumed,
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.totalCost - a.totalCost),
      totalConsumptionCost,
      totalMovements: movements.length
    };
  }
    }),
    { name: 'cmms-inventory', partialize: (state) => ({ items: state.items, movements: state.movements }) }
  )
);
