import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialAmefs = [
  { 
    id: '1', 
    assetTag: 'BMB-01', 
    failureMode: 'Fuga en sello mecánico', 
    failureEffect: 'Pérdida de presión en línea de lubricación', 
    failureCause: 'Desgaste abrasivo por partículas',
    severity: 8, occurrence: 5, detection: 6, npr: 240, 
    recommendedAction: 'Instalar sistema de filtración de 10 micras y doble sello',
    newSeverity: 8, newOccurrence: 2, newDetection: 3, newNPR: 48,
    status: 'pendiente' 
  },
  { 
    id: '2', 
    assetTag: 'CNC-03', 
    failureMode: 'Falla en rodamiento de husillo', 
    failureEffect: 'Vibración excesiva y rayado de pieza', 
    failureCause: 'Falta de lubricación automática',
    severity: 9, occurrence: 3, detection: 5, npr: 135, 
    recommendedAction: 'Instalar sensor de vibración RT y lubricador automático',
    newSeverity: 9, newOccurrence: 1, newDetection: 2, newNPR: 18,
    status: 'implementado' 
  },
  { 
    id: '3', 
    assetTag: 'COMP-02', 
    failureMode: 'Sobrecalentamiento de bloque', 
    failureEffect: 'Paro por seguridad / Daño térmico', 
    failureCause: 'Obstrucción de intercambiador de calor',
    severity: 7, occurrence: 6, detection: 4, npr: 168, 
    recommendedAction: 'Plan de limpieza química semestral y termografía mensual',
    newSeverity: 7, newOccurrence: 2, newDetection: 2, newNPR: 28,
    status: 'pendiente' 
  },
  { 
    id: '4', 
    assetTag: 'BMB-01', 
    failureMode: 'Cavitación en impulsor', 
    failureEffect: 'Fallo estructural del activo', 
    failureCause: 'Bajo nivel de succión (NPSH)',
    severity: 10, occurrence: 4, detection: 7, npr: 280, 
    recommendedAction: 'Rediseño de tubería de succión y alarma de bajo nivel',
    newSeverity: 10, newOccurrence: 1, newDetection: 2, newNPR: 20,
    status: 'pendiente' 
  },
  {
    id: '5',
    assetTag: 'PRENSA-09',
    failureMode: 'Fisura en columna estructural',
    failureEffect: 'Colapso de prensa / Riesgo de fatalidad',
    failureCause: 'Fatiga de material por ciclos excedidos',
    severity: 10, occurrence: 2, detection: 8, npr: 160,
    recommendedAction: 'Inspección por partículas magnéticas trimestral',
    newSeverity: 10, newOccurrence: 1, newDetection: 4, newNPR: 40,
    status: 'pendiente'
  },
  {
    id: '6',
    assetTag: 'MONT-10',
    failureMode: 'Pérdida de presión en frenos',
    failureEffect: 'Atropellamiento / Colisión en almacén',
    failureCause: 'Fuga en cilindro maestro',
    severity: 9, occurrence: 3, detection: 4, npr: 108,
    recommendedAction: 'Checklist diario de frenado y cambio preventivo anual de sellos',
    newSeverity: 9, newOccurrence: 1, newDetection: 2, newNPR: 18,
    status: 'implementado'
  },
  {
    id: '7',
    assetTag: 'UPS-13',
    failureMode: 'Fallo de celdas de batería',
    failureEffect: 'Apagado de servidores / Pérdida de datos',
    failureCause: 'Fin de vida útil (sulfatación)',
    severity: 8, occurrence: 5, detection: 3, npr: 120,
    recommendedAction: 'Instalar sistema de monitoreo de impedancia por celda',
    newSeverity: 8, newOccurrence: 1, newDetection: 2, newNPR: 16,
    status: 'pendiente'
  },
  {
    id: '8',
    assetTag: 'TRAFO-14',
    failureMode: 'Degradación dieléctrica del aceite',
    failureEffect: 'Explosión de transformador / Incendio',
    failureCause: 'Contaminación por humedad',
    severity: 10, occurrence: 2, detection: 6, npr: 120,
    recommendedAction: 'Pruebas de rigidez dieléctrica y cromatografía de gases anual',
    newSeverity: 10, newOccurrence: 1, newDetection: 2, newNPR: 20,
    status: 'pendiente'
  },
  {
    id: '9',
    assetTag: 'CONV-05',
    failureMode: 'Desalineación y rotura de banda',
    failureEffect: 'Paro total de línea de producción',
    failureCause: 'Acumulación de residuos en rodillos',
    severity: 10, occurrence: 5, detection: 7, npr: 350,
    recommendedAction: 'Instalar sensores de desalineación y guardas autolimpiantes',
    newSeverity: 10, newOccurrence: 2, newDetection: 2, newNPR: 40,
    status: 'pendiente'
  },
  {
    id: '10',
    assetTag: 'GEN-11',
    failureMode: 'Fallo de arranque en emergencia',
    failureEffect: 'Pérdida total de servicios críticos',
    failureCause: 'Batería de arranque sulfatada / baja carga',
    severity: 10, occurrence: 4, detection: 6, npr: 240,
    recommendedAction: 'Instalar cargador inteligente con monitoreo remoto de voltaje',
    newSeverity: 10, newOccurrence: 1, newDetection: 2, newNPR: 20,
    status: 'implementado'
  }
];

export const useAmefStore = create(
  persist(
    (set, get) => ({
      amefs: initialAmefs,

      addAmefAnalysis: (data) => set((state) => {
        const npr = data.severity * data.occurrence * data.detection;
        const newNPR = (data.newSeverity || data.severity) * (data.newOccurrence || 1) * (data.newDetection || 1);
        return { amefs: [{ ...data, id: crypto.randomUUID(), npr, newNPR, status: 'pendiente' }, ...state.amefs] };
      }),

      implementMitigation: (id) => set((state) => ({
        amefs: state.amefs.map(a => a.id === id ? { ...a, status: 'implementado' } : a)
      })),

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
    }),
    { name: 'cmms-amef', partialize: (state) => ({ amefs: state.amefs }) }
  )
);
