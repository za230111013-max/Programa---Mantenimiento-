import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const usePredictiveStore = create((set, get) => ({
  thresholds: {},
  readings: [],
  loading: false,
  error: null,

  fetchPredictiveData: async () => {
    set({ loading: true });
    try {
      const { data: thresholdData, error: thresholdErr } = await supabase
        .from('predictive_thresholds')
        .select('*');

      if (thresholdErr) throw thresholdErr;

      const mappedThresholds = {};
      thresholdData.forEach(item => {
        mappedThresholds[item.asset_id] = {
          vibration: { warning: Number(item.vib_warning), danger: Number(item.vib_danger), unit: item.vib_unit },
          temperature: { warning: Number(item.temp_warning), danger: Number(item.temp_danger), unit: item.temp_unit },
          current: { warning: Number(item.curr_warning), danger: Number(item.curr_danger), unit: item.curr_unit }
        };
      });

      const { data: readingData, error: readingErr } = await supabase
        .from('predictive_readings')
        .select('*')
        .order('timestamp', { ascending: false });

      if (readingErr) throw readingErr;

      const mappedReadings = readingData.map(item => ({
        id: item.id,
        assetId: item.asset_id,
        vibration: Number(item.vibration),
        temperature: Number(item.temperature),
        current: Number(item.current),
        timestamp: item.timestamp
      }));

      set({ thresholds: mappedThresholds, readings: mappedReadings, loading: false });
    } catch (err) {
      console.error('Error fetching predictive data:', err);
      set({ error: err.message, loading: false });
    }
  },

  addReading: async (assetId, reading) => {
    set({ loading: true });
    try {
      const dbReading = {
        asset_id: assetId,
        vibration: Number(reading.vibration),
        temperature: Number(reading.temperature),
        current: Number(reading.current),
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('predictive_readings')
        .insert([dbReading]);

      if (error) throw error;

      await get().fetchPredictiveData();
    } catch (err) {
      console.error('Error adding reading:', err);
      set({ error: err.message, loading: false });
    }
  },

  updateThresholds: async (assetId, newThresholds) => {
    set({ loading: true });
    try {
      const dbThreshold = {
        asset_id: assetId,
        vib_warning: Number(newThresholds.vibration.warning),
        vib_danger: Number(newThresholds.vibration.danger),
        vib_unit: newThresholds.vibration.unit,
        temp_warning: Number(newThresholds.temperature.warning),
        temp_danger: Number(newThresholds.temperature.danger),
        temp_unit: newThresholds.temperature.unit,
        curr_warning: Number(newThresholds.current.warning),
        curr_danger: Number(newThresholds.current.danger),
        curr_unit: newThresholds.current.unit
      };

      const { error } = await supabase
        .from('predictive_thresholds')
        .upsert(dbThreshold);

      if (error) throw error;

      await get().fetchPredictiveData();
    } catch (err) {
      console.error('Error updating thresholds:', err);
      set({ error: err.message, loading: false });
    }
  },

  getLatestReading: (assetId) => get().readings.find(r => r.assetId === assetId) || null,

  getHealthStatus: (assetId) => {
    const latest = get().getLatestReading(assetId);
    if (!latest) return 'normal';
    const limit = get().thresholds[assetId];
    if (!limit) return 'normal';
    const isDanger = latest.vibration >= limit.vibration.danger || latest.temperature >= limit.temperature.danger || latest.current >= limit.current.danger;
    if (isDanger) return 'danger';
    const isWarning = latest.vibration >= limit.vibration.warning || latest.temperature >= limit.temperature.warning || latest.current >= limit.current.warning;
    if (isWarning) return 'warning';
    return 'normal';
  },

  calculateRUL: (assetId) => {
    const readings = get().readings.filter(r => r.assetId === assetId).slice(0, 12);
    if (readings.length < 2) return 45;
    const vibrations = readings.map(r => r.vibration).reverse();
    const avgRecent = vibrations.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const avgOlder = vibrations.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const trendRate = (avgRecent - avgOlder) / readings.length;
    const limit = get().thresholds[assetId];
    if (!limit || trendRate <= 0) return 45;
    const remaining = (limit.vibration.danger - avgRecent) / trendRate;
    const rulDays = Math.max(1, Math.min(90, Math.round(remaining / 24)));
    return rulDays;
  }
}));
