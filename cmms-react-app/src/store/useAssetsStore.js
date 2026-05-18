import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialAssets = [
  { id: 'ast_001', tag: 'BMB-01', name: 'Bomba Principal Hidráulica', area: 'Producción', currentHours: 1250, criticality: 'A', lastMaintenance: '2024-04-15', healthScore: 85 },
  { id: 'ast_002', tag: 'COMP-02', name: 'Compresor de Aire Kaeser', area: 'Servicios', currentHours: 840, criticality: 'B', lastMaintenance: '2024-04-01', healthScore: 92 },
  { id: 'ast_003', tag: 'CNC-03', name: 'Torno CNC Mazak', area: 'Maquinado', currentHours: 3200, criticality: 'A', lastMaintenance: '2024-04-20', healthScore: 78 },
  { id: 'ast_004', tag: 'MV-04', name: 'Motor Ventilador Extracción', area: 'Servicios', currentHours: 2100, criticality: 'B', lastMaintenance: '2024-03-28', healthScore: 88 },
  { id: 'ast_005', tag: 'CONV-05', name: 'Transportador de Banda Principal', area: 'Producción', currentHours: 4500, criticality: 'A', lastMaintenance: '2024-04-10', healthScore: 72 },
  { id: 'ast_006', tag: 'SOLD-06', name: 'Máquina de Soldadura MIG/MAG', area: 'Fabricación', currentHours: 1800, criticality: 'B', lastMaintenance: '2024-03-15', healthScore: 90 },
  { id: 'ast_007', tag: 'TAB-07', name: 'Tablero Eléctrico Principal CCM', area: 'Eléctrico', currentHours: 8760, criticality: 'A', lastMaintenance: '2024-04-05', healthScore: 95 },
  { id: 'ast_008', tag: 'CHILLER-08', name: 'Chiller de Proceso 20 Ton', area: 'Servicios', currentHours: 5200, criticality: 'A', lastMaintenance: '2024-03-20', healthScore: 80 },
  { id: 'ast_009', tag: 'PRENSA-09', name: 'Prensa Hidráulica 100 Ton', area: 'Producción', currentHours: 3800, criticality: 'A', lastMaintenance: '2024-04-12', healthScore: 75 },
  { id: 'ast_010', tag: 'MONT-10', name: 'Montacargas Toyota 2.5 Ton', area: 'Almacén', currentHours: 6200, criticality: 'B', lastMaintenance: '2024-04-18', healthScore: 82 },
  { id: 'ast_011', tag: 'GEN-11', name: 'Generador Diésel de Emergencia', area: 'Servicios', currentHours: 320, criticality: 'A', lastMaintenance: '2024-02-10', healthScore: 97 },
  { id: 'ast_012', tag: 'TORN-12', name: 'Torno Convencional Harrison', area: 'Maquinado', currentHours: 7500, criticality: 'C', lastMaintenance: '2024-03-01', healthScore: 68 },
  { id: 'ast_013', tag: 'UPS-13', name: 'UPS Industrial Eaton 30kVA', area: 'Eléctrico', currentHours: 4380, criticality: 'A', lastMaintenance: '2024-03-10', healthScore: 91 },
  { id: 'ast_014', tag: 'TRAFO-14', name: 'Transformador Seco 500kVA', area: 'Eléctrico', currentHours: 17520, criticality: 'A', lastMaintenance: '2024-01-20', healthScore: 94 },
];

export const useAssetsStore = create(
  persist(
    (set, get) => ({
      assets: initialAssets,
      updateAssetHours: (id, newHours) => set((state) => ({
        assets: state.assets.map(a => a.id === id ? { ...a, currentHours: newHours } : a)
      })),
      applyOTImpactToHealth: (assetTag, otType) => set((state) => ({
        assets: state.assets.map(a => {
          if (a.tag === assetTag) {
            let healthChange = 0;
            if (otType === 'preventivo') healthChange = 5;
            if (otType === 'correctivo') healthChange = -10;
            if (otType === 'emergencia') healthChange = -20;
            const newScore = Math.max(0, Math.min(100, (a.healthScore || 90) + healthChange));
            return { ...a, healthScore: newScore, lastMaintenance: new Date().toISOString() };
          }
          return a;
        })
      })),
      getAssetReliability: (id) => {
        const asset = get().assets.find(a => a.id === id);
        if (!asset) return 100;
        const healthFactor = (asset.healthScore || 90) / 100;
        return (healthFactor * 100).toFixed(1);
      },
      getAssetById: (id) => get().assets.find(a => a.id === id)
    }),
    { name: 'cmms-assets', partialize: (state) => ({ assets: state.assets }) }
  )
);
