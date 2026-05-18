import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useInventoryStore = create((set, get) => ({
  items: [],
  movements: [],
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true });
    try {
      const { data: parts, error: partsErr } = await supabase
        .from('inventory_items')
        .select('*')
        .order('id', { ascending: true });

      if (partsErr) throw partsErr;

      const { data: movements, error: movsErr } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('date', { ascending: false });

      if (movsErr) throw movsErr;

      const mappedItems = parts.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: Number(item.current_stock),
        minStock: Number(item.min_stock),
        maxStock: Number(item.max_stock),
        reorderPoint: Number(item.reorder_point),
        unitCost: Number(item.unit_cost),
        location: item.location,
        supplier: item.supplier,
        compatibleAssets: item.compatible_assets || []
      }));

      const mappedMovements = movements.map(item => ({
        id: item.id,
        partId: item.part_id,
        partCode: item.part_code,
        partName: item.part_name,
        type: item.type,
        quantity: Number(item.quantity),
        reason: item.reason,
        notes: item.notes,
        orderId: item.order_id,
        assetTag: item.asset_tag,
        user: item.user_name,
        previousStock: Number(item.previous_stock),
        newStock: Number(item.new_stock),
        date: item.date
      }));

      set({ items: mappedItems, movements: mappedMovements, loading: false });
    } catch (err) {
      console.error('Error fetching inventory:', err);
      set({ error: err.message, loading: false });
    }
  },

  addPart: async (partData) => {
    set({ loading: true });
    try {
      const id = partData.id || `inv_${crypto.randomUUID().slice(0,8)}`;
      const dbPart = {
        id,
        code: partData.code,
        name: partData.name,
        category: partData.category,
        unit: partData.unit,
        current_stock: partData.currentStock || 0,
        min_stock: partData.minStock || 0,
        max_stock: partData.maxStock || 0,
        reorder_point: partData.reorderPoint || 0,
        unit_cost: partData.unitCost || 0,
        location: partData.location,
        supplier: partData.supplier,
        compatible_assets: partData.compatibleAssets || []
      };

      const { error } = await supabase
        .from('inventory_items')
        .insert([dbPart]);

      if (error) throw error;

      await get().fetchInventory();
    } catch (err) {
      console.error('Error adding part:', err);
      set({ error: err.message, loading: false });
    }
  },

  updatePart: async (id, updates) => {
    set({ loading: true });
    try {
      const dbUpdates = {};
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
      if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
      if (updates.maxStock !== undefined) dbUpdates.max_stock = updates.maxStock;
      if (updates.reorderPoint !== undefined) dbUpdates.reorder_point = updates.reorderPoint;
      if (updates.unitCost !== undefined) dbUpdates.unit_cost = updates.unitCost;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
      if (updates.compatibleAssets !== undefined) dbUpdates.compatible_assets = updates.compatibleAssets;

      const { error } = await supabase
        .from('inventory_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchInventory();
    } catch (err) {
      console.error('Error updating part:', err);
      set({ error: err.message, loading: false });
    }
  },

  deletePart: async (id) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchInventory();
    } catch (err) {
      console.error('Error deleting part:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateStockLevels: async (id, { minStock, maxStock, reorderPoint }) => {
    await get().updatePart(id, { minStock, maxStock, reorderPoint });
  },

  recordMovement: async (partId, type, quantity, reason, notes, user, orderId = null, assetTag = null) => {
    set({ loading: true });
    try {
      const part = get().items.find(p => p.id === partId);
      if (!part) return;

      const previousStock = part.currentStock;
      const newStock = type === 'entrada' ? previousStock + quantity : previousStock - quantity;
      const finalNewStock = Math.max(0, newStock);

      const dbMovement = {
        part_id: partId,
        part_code: part.code,
        part_name: part.name,
        type,
        quantity,
        reason,
        notes,
        order_id: orderId,
        asset_tag: assetTag,
        user_name: user || 'Sistema',
        previous_stock: previousStock,
        new_stock: finalNewStock,
        date: new Date().toISOString()
      };

      const { error: movErr } = await supabase
        .from('inventory_movements')
        .insert([dbMovement]);

      if (movErr) throw movErr;

      const { error: partErr } = await supabase
        .from('inventory_items')
        .update({ current_stock: finalNewStock })
        .eq('id', partId);

      if (partErr) throw partErr;

      await get().fetchInventory();
    } catch (err) {
      console.error('Error recording movement:', err);
      set({ error: err.message, loading: false });
    }
  },

  consumeForOrder: (partId, quantity, orderId, assetTag, notes, user) => {
    get().recordMovement(partId, 'salida', quantity, 'consumo_ot', notes || `Consumo OT ${orderId}`, user, orderId, assetTag);
  },

  getLowStockItems: () => get().items.filter(item => item.currentStock <= item.minStock),
  getTotalInventoryValue: () => get().items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0),
  getCategories: () => [...new Set(get().items.map(item => item.category))],

  getReorderAlerts: () => {
    return get().items
      .filter(item => item.currentStock <= item.reorderPoint)
      .map(item => {
        let severity = 'low';
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
}));
