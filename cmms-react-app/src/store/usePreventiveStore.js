import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const usePreventiveStore = create((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const mappedPlans = data.map(item => ({
        id: item.id,
        assetId: item.asset_id,
        name: item.name,
        type: item.type,
        intervalDays: item.interval_days,
        nextDueDate: item.next_due_date,
        intervalHours: item.interval_hours,
        nextDueHours: item.next_due_hours,
        compliance: Number(item.compliance),
        estimatedHours: Number(item.estimated_hours),
        requiredParts: item.required_parts || [],
        checklist: item.checklist || []
      }));

      set({ plans: mappedPlans, loading: false });
    } catch (err) {
      console.error('Error fetching preventive plans:', err);
      set({ error: err.message, loading: false });
    }
  },

  createPlan: async (planData) => {
    set({ loading: true });
    try {
      const id = `plan_${crypto.randomUUID().slice(0,8)}`;
      const dbPlan = {
        id,
        asset_id: planData.assetId,
        name: planData.name,
        type: planData.type,
        interval_days: planData.intervalDays ? Number(planData.intervalDays) : null,
        next_due_date: planData.nextDueDate || null,
        interval_hours: planData.intervalHours ? Number(planData.intervalHours) : null,
        next_due_hours: planData.nextDueHours ? Number(planData.nextDueHours) : null,
        compliance: 100,
        estimated_hours: Number(planData.estimatedHours || 1),
        required_parts: planData.requiredParts || [],
        checklist: planData.checklist || []
      };

      const { error } = await supabase
        .from('preventive_maintenance')
        .insert([dbPlan]);

      if (error) throw error;

      await get().fetchPlans();
    } catch (err) {
      console.error('Error creating preventive plan:', err);
      set({ error: err.message, loading: false });
    }
  },

  updatePlan: async (planId, updates) => {
    set({ loading: true });
    try {
      const dbUpdates = {};
      if (updates.requiredParts !== undefined) dbUpdates.required_parts = updates.requiredParts;

      const { error } = await supabase
        .from('preventive_maintenance')
        .update(dbUpdates)
        .eq('id', planId);

      if (error) throw error;

      await get().fetchPlans();
    } catch (err) {
      console.error('Error updating plan:', err);
      set({ error: err.message, loading: false });
    }
  },

  executePlan: async (planId) => {
    set({ loading: true });
    try {
      const plan = get().plans.find(p => p.id === planId);
      if (!plan) return;

      const updates = {};
      if (plan.type === 'tiempo') {
        const nextDate = new Date(plan.nextDueDate);
        nextDate.setDate(nextDate.getDate() + (parseInt(plan.intervalDays) || 30));
        updates.next_due_date = nextDate.toISOString().split('T')[0];
      } else {
        updates.next_due_hours = plan.nextDueHours + (parseInt(plan.intervalHours) || 500);
      }

      const { error } = await supabase
        .from('preventive_maintenance')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      await get().fetchPlans();
    } catch (err) {
      console.error('Error executing plan:', err);
      set({ error: err.message, loading: false });
    }
  },

  checkAndGenerateWOs: async (assetsStore, ordersStore) => {
    const plans = get().plans;
    const now = new Date();
    const generated = [];

    for (const plan of plans) {
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

        await ordersStore?.createOrder(newOrder);
        generated.push(plan.name);

        await get().executePlan(plan.id);
      }
    }

    return generated;
  }
}));
