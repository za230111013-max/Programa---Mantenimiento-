import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAssetsStore = create((set, get) => ({
  assets: [],
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const mappedAssets = data.map(item => ({
        id: item.id,
        tag: item.tag,
        name: item.name,
        area: item.area,
        currentHours: Number(item.current_hours),
        criticality: item.criticality,
        lastMaintenance: item.last_maintenance,
        healthScore: Number(item.health_score)
      }));

      set({ assets: mappedAssets, loading: false });
    } catch (err) {
      console.error('Error fetching assets:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateAssetHours: async (id, newHours) => {
    set((state) => ({
      assets: state.assets.map(a => a.id === id ? { ...a, currentHours: newHours } : a)
    }));

    try {
      const { error } = await supabase
        .from('assets')
        .update({ current_hours: newHours })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating asset hours:', err);
      get().fetchAssets();
    }
  },

  applyOTImpactToHealth: async (assetTag, otType) => {
    const asset = get().assets.find(a => a.tag === assetTag);
    if (!asset) return;

    let healthChange = 0;
    if (otType === 'preventivo') healthChange = 5;
    if (otType === 'correctivo') healthChange = -10;
    if (otType === 'emergencia') healthChange = -20;
    const newScore = Math.max(0, Math.min(100, (asset.healthScore || 90) + healthChange));
    const nowIso = new Date().toISOString();

    set((state) => ({
      assets: state.assets.map(a => a.tag === assetTag ? { ...a, healthScore: newScore, lastMaintenance: nowIso } : a)
    }));

    try {
      const { error } = await supabase
        .from('assets')
        .update({ health_score: newScore, last_maintenance: nowIso })
        .eq('tag', assetTag);

      if (error) throw error;
    } catch (err) {
      console.error('Error applying OT impact to health:', err);
      get().fetchAssets();
    }
  },

  getAssetReliability: (id) => {
    const asset = get().assets.find(a => a.id === id);
    if (!asset) return 100;
    const healthFactor = (asset.healthScore || 90) / 100;
    return (healthFactor * 100).toFixed(1);
  },

  getAssetById: (id) => get().assets.find(a => a.id === id)
}));
