import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAmefStore = create((set, get) => ({
  amefs: [],
  loading: false,
  error: null,

  fetchAmefs: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('amef_records')
        .select('*')
        .order('npr', { ascending: false });

      if (error) throw error;

      const mappedAmefs = data.map(item => ({
        id: item.id,
        assetTag: item.asset_tag,
        failureMode: item.failure_mode,
        failureEffect: item.failure_effect,
        failureCause: item.failure_cause,
        severity: Number(item.severity),
        occurrence: Number(item.occurrence),
        detection: Number(item.detection),
        npr: Number(item.npr),
        recommendedAction: item.recommended_action,
        newSeverity: item.new_severity ? Number(item.new_severity) : null,
        newOccurrence: item.new_occurrence ? Number(item.new_occurrence) : null,
        newDetection: item.new_detection ? Number(item.new_detection) : null,
        newNPR: item.new_npr ? Number(item.new_npr) : null,
        status: item.status
      }));

      set({ amefs: mappedAmefs, loading: false });
    } catch (err) {
      console.error('Error fetching AMEF records:', err);
      set({ error: err.message, loading: false });
    }
  },

  addAmefAnalysis: async (data) => {
    set({ loading: true });
    try {
      const npr = data.severity * data.occurrence * data.detection;
      const newNPR = (data.newSeverity || data.severity) * (data.newOccurrence || 1) * (data.newDetection || 1);

      const dbAmef = {
        asset_tag: data.assetTag,
        failure_mode: data.failureMode,
        failure_effect: data.failureEffect,
        failure_cause: data.failureCause,
        severity: Number(data.severity),
        occurrence: Number(data.occurrence),
        detection: Number(data.detection),
        npr,
        recommended_action: data.recommendedAction,
        new_severity: data.newSeverity ? Number(data.newSeverity) : null,
        new_occurrence: data.newOccurrence ? Number(data.newOccurrence) : null,
        new_detection: data.newDetection ? Number(data.newDetection) : null,
        new_npr: newNPR,
        status: 'pendiente'
      };

      const { error } = await supabase
        .from('amef_records')
        .insert([dbAmef]);

      if (error) throw error;

      await get().fetchAmefs();
    } catch (err) {
      console.error('Error adding AMEF analysis:', err);
      set({ error: err.message, loading: false });
    }
  },

  implementMitigation: async (id) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('amef_records')
        .update({ status: 'implementado' })
        .eq('id', id);

      if (error) throw error;

      await get().fetchAmefs();
    } catch (err) {
      console.error('Error implementing mitigation:', err);
      set({ error: err.message, loading: false });
    }
  },

  getKPIs: () => {
    const amefs = get().amefs;
    const total = amefs.length;
    if (total === 0) return { total: 0, critical: 0, high: 0, implemented: 0, avgNPR: 0, avgNewNPR: 0 };
    
    const critical = amefs.filter(a => a.npr >= 200).length;
    const high = amefs.filter(a => a.npr >= 120 && a.npr < 200).length;
    const implemented = amefs.filter(a => a.status === 'implementado').length;
    
    const avgNPR = amefs.reduce((acc, curr) => acc + curr.npr, 0) / total;
    const avgNewNPR = amefs.reduce((acc, curr) => acc + (curr.newNPR || curr.npr), 0) / total;

    return { total, critical, high, implemented, avgNPR, avgNewNPR };
  }
}));
