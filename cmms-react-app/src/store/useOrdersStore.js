import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const SLA_HOURS = { P1: 2, P2: 8, P3: 24, P4: 72 };

export const useOrdersStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedOrders = data.map(item => ({
        id: item.id,
        folio: item.folio,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        assetTag: item.asset_tag,
        createdAt: item.created_at,
        closedAt: item.closed_at,
        dueDate: item.due_date,
        repairHours: item.repair_hours ? Number(item.repair_hours) : null,
        type: item.type,
        failureCause: item.failure_cause,
        rootCause: item.root_cause || [],
        area: item.area,
        createdBy: item.created_by,
        closureNotes: item.closure_notes,
        checklist: item.checklist || []
      }));

      set({ orders: mappedOrders, loading: false });
    } catch (err) {
      console.error('Error fetching orders:', err);
      set({ error: err.message, loading: false });
    }
  },

  createOrder: async (newOrder) => {
    set({ loading: true });
    try {
      const { count, error: countErr } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      const nextNum = (count || 0) + 101;
      const year = new Date().getFullYear();
      const folio = `OT-${year}-${String(nextNum).padStart(4, '0')}`;

      const hours = SLA_HOURS[newOrder.priority] || 24;
      const dueDate = new Date(Date.now() + 3600000 * hours).toISOString();
      const createdAt = new Date().toISOString();

      // Find asset area to match
      const assetArea = newOrder.area || 'Producción';

      const dbOrder = {
        folio,
        title: newOrder.title,
        description: newOrder.description,
        priority: newOrder.priority,
        status: 'abierta',
        asset_tag: newOrder.assetTag,
        created_at: createdAt,
        due_date: dueDate,
        type: newOrder.type,
        area: assetArea,
        created_by: newOrder.createdBy || 'Sistema',
        checklist: newOrder.checklist || [],
        failure_cause: newOrder.failureCause || null,
        root_cause: newOrder.rootCause || null,
        closure_notes: newOrder.closureNotes || null
      };

      const { error } = await supabase
        .from('work_orders')
        .insert([dbOrder]);

      if (error) throw error;

      await get().fetchOrders();
    } catch (err) {
      console.error('Error creating order:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateOrder: async (id, updatedFields) => {
    set({ loading: true });
    try {
      const dbUpdates = {
        title: updatedFields.title,
        description: updatedFields.description,
        priority: updatedFields.priority,
        type: updatedFields.type,
        area: updatedFields.area,
        asset_tag: updatedFields.assetTag
      };

      const { error } = await supabase
        .from('work_orders')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateOrderStatus: async (id, newStatus, closureData = null) => {
    set({ loading: true });
    try {
      const updates = { status: newStatus };

      if (closureData) {
        updates.closure_notes = closureData.notes;
        updates.closed_at = new Date().toISOString();
        updates.repair_hours = closureData.repairHours || 0;
        updates.failure_cause = closureData.failureCause;
        updates.root_cause = closureData.rootCause || [];
      }

      const { error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error al actualizar el estado: ' + err.message + '\n\nAsegúrate de que el estado esté permitido en la base de datos (Ej: falta actualizar el CONSTRAINT de status en Supabase para permitir "en_espera").');
      set({ error: err.message, loading: false });
    }
  },

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
}));
