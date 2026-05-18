import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialThresholds = {
  'BMB-01': { vibration: { warning: 5.0, danger: 8.0, unit: 'mm/s' }, temperature: { warning: 70, danger: 85, unit: '°C' }, current: { warning: 22, danger: 25, unit: 'A' } },
  'CNC-03': { vibration: { warning: 3.5, danger: 6.0, unit: 'mm/s' }, temperature: { warning: 80, danger: 95, unit: '°C' }, current: { warning: 15, danger: 18, unit: 'A' } },
  'COMP-02': { vibration: { warning: 2.0, danger: 4.5, unit: 'mm/s' }, temperature: { warning: 60, danger: 75, unit: '°C' }, current: { warning: 40, danger: 50, unit: 'A' } }
};

const generateHistory = (assetId, baseVib, baseTemp, baseAmp) => {
  const history = [];
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    history.push({
      id: `${assetId}-${i}`, assetId,
      vibration: baseVib + Math.random() * 2,
      temperature: baseTemp + Math.random() * 5,
      current: baseAmp + Math.random() * 2,
      timestamp: new Date(now - i * 3600000).toISOString()
    });
  }
  return history;
};

const initialReadings = [
  ...generateHistory('BMB-01', 3.2, 55, 18),
  ...generateHistory('CNC-03', 2.1, 72, 12),
  ...generateHistory('COMP-02', 1.5, 50, 38),
];

export const usePredictiveStore = create(
  persist(
    (set, get) => ({
      thresholds: initialThresholds,
      readings: initialReadings,
      addReading: (assetId, reading) => set((state) => ({ 
        readings: [{ ...reading, assetId, timestamp: new Date().toISOString(), id: crypto.randomUUID() }, ...state.readings] 
      })),
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
        // Trend-based RUL: check vibration trend slope
        const vibrations = readings.map(r => r.vibration).reverse();
        const avgRecent = vibrations.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const avgOlder = vibrations.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const trendRate = (avgRecent - avgOlder) / readings.length; // per hour
        const limit = get().thresholds[assetId];
        if (!limit || trendRate <= 0) return 45;
        const remaining = (limit.vibration.danger - avgRecent) / trendRate;
        const rulDays = Math.max(1, Math.min(90, Math.round(remaining / 24)));
        return rulDays;
      },
      updateThresholds: (assetId, newThresholds) => set((state) => ({ 
        thresholds: { ...state.thresholds, [assetId]: newThresholds } 
      }))
    }),
    { name: 'cmms-predictive', partialize: (state) => ({ thresholds: state.thresholds, readings: state.readings }) }
  )
);
