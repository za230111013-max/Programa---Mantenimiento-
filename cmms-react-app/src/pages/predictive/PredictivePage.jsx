import { useState, useEffect, useMemo } from 'react';
import { usePredictiveStore } from '../../store/usePredictiveStore';
import { useAssetsStore } from '../../store/useAssetsStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Activity, 
  Thermometer, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  Settings2,
  CheckCircle2,
  ChevronRight,
  Database,
  Cpu,
  ShieldAlert,
  Clock,
  Gauge,
  ArrowUpRight,
  Play
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function PredictivePage() {
  const navigate = useNavigate();
  const { assets } = useAssetsStore();
  const { createOrder } = useOrdersStore();
  const { readings, thresholds, getLatestReading, getHealthStatus, addReading, calculateRUL } = usePredictiveStore();
  
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.tag || 'BMB-01');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { updateThresholds } = usePredictiveStore();
  const [tempLimits, setTempLimits] = useState(null);

  const selectedAsset = assets.find(a => a.tag === selectedAssetId);
  const latest = getLatestReading(selectedAssetId);
  const limit = thresholds[selectedAssetId];
  const health = getHealthStatus(selectedAssetId);
  const rul = calculateRUL(selectedAssetId);

  // Filtrar lecturas para el gráfico (invertir para que el tiempo fluya de izquierda a derecha)
  const chartData = useMemo(() => {
    return readings
      .filter(r => r.assetId === selectedAssetId)
      .slice(0, 15)
      .reverse()
      .map(r => ({
        ...r,
        time: new Date(r.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      }));
  }, [readings, selectedAssetId]);

  // Simulación de Telemetría Real-time
  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        const data = {
          vibration: (latest?.vibration || 2) + (Math.random() - 0.5) * 0.5,
          temperature: (latest?.temperature || 60) + (Math.random() - 0.5) * 2,
          current: (latest?.current || 20) + (Math.random() - 0.5) * 1
        };
        addReading(selectedAssetId, data);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedAssetId, latest, addReading]);

  const handleCreatePdMOrder = () => {
    createOrder({
      title: `PdM ALERTA: Anomalía detectada en ${selectedAssetId}`,
      description: `Disparo automático por umbral excedido. Lectura: Vib ${latest?.vibration.toFixed(2)} mm/s, Temp ${latest?.temperature.toFixed(1)}°C. RUL restate: ${rul} días.`,
      assetTag: selectedAssetId,
      priority: health === 'danger' ? 'P1' : 'P2',
      type: 'emergencia'
    });
    navigate('/orders');
  };

  const handleOpenConfig = () => {
    setTempLimits(JSON.parse(JSON.stringify(limit)));
    setShowConfigModal(true);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    updateThresholds(selectedAssetId, tempLimits);
    setShowConfigModal(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4">
      
      {/* CYBER HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary-950 rounded-lg border border-secondary-800 shadow-2xl">
                 <Database className="w-6 h-6 text-primary-500 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Telemetría Predictiva (PdM)</h1>
           </div>
           <p className="text-gray-500 font-medium ml-12">Monitoreo de condición en tiempo real y análisis de tendencias de falla.</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsSimulating(!isSimulating)}
             className={cn(
               "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
               isSimulating ? "bg-green-100 text-green-700 border border-green-200" : "bg-secondary-900 text-white shadow-xl"
             )}
           >
             <Play className={cn("w-4 h-4", isSimulating && "animate-spin")} />
             {isSimulating ? "Streaming Activo" : "Iniciar Streaming"}
           </button>
           <button 
             onClick={handleOpenConfig}
             className="bg-white text-gray-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] border border-gray-100 shadow-sm hover:bg-gray-50 transition-all"
           >
             <Settings2 className="w-4 h-4" />
             Config
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ASSET SELECTOR PANEL */}
        <div className="xl:col-span-3 space-y-4">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-2">Nodos de Monitoreo</h3>
           {assets.map(asset => {
              const assetHealth = getHealthStatus(asset.tag);
              const isActive = selectedAssetId === asset.tag;
              return (
                <button 
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.tag)}
                  className={cn(
                    "w-full group relative overflow-hidden p-5 rounded-[2rem] border-2 transition-all text-left",
                    isActive ? "bg-secondary-950 border-secondary-800 shadow-2xl scale-[1.02] z-10" : "bg-white border-transparent hover:border-gray-100"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                          isActive ? "bg-primary-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                        )}>
                           <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                           <p className={cn("font-black text-lg leading-none", isActive ? "text-white" : "text-gray-900")}>{asset.tag}</p>
                           <p className={cn("text-[9px] font-bold mt-1 uppercase tracking-widest", isActive ? "text-secondary-400" : "text-gray-400")}>{asset.area}</p>
                        </div>
                     </div>
                     <div className={cn(
                       "w-3 h-3 rounded-full shadow-[0_0_12px]",
                       assetHealth === 'normal' ? "bg-green-500 shadow-green-500/50" : assetHealth === 'warning' ? "bg-yellow-500 shadow-yellow-500/50" : "bg-red-500 shadow-red-500/50 animate-pulse"
                     )} />
                  </div>
                  {isActive && <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-24 h-24 rotate-12 text-white" /></div>}
                </button>
              );
           })}
        </div>

        {/* MAIN PdM DASHBOARD */}
        <div className="xl:col-span-9 space-y-8 animate-in fade-in zoom-in-95 duration-500">
           
           {/* CRITICAL STATUS CARD */}
           <div className={cn(
             "relative p-8 md:p-12 rounded-[3rem] border-2 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10",
             health === 'normal' ? "bg-green-50/30 border-green-100" : health === 'warning' ? "bg-yellow-50/30 border-yellow-100" : "bg-red-50/30 border-red-100"
           )}>
              <div className="flex items-center gap-8 relative z-10">
                 <div className={cn(
                    "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl",
                    health === 'normal' ? "bg-green-500 text-white shadow-green-100" : health === 'warning' ? "bg-yellow-500 text-white shadow-yellow-100" : "bg-red-500 text-white shadow-red-100"
                 )}>
                    {health === 'normal' ? <CheckCircle2 className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">
                      {health === 'normal' ? 'Sistema Nominal' : health === 'warning' ? 'Advertencia Nivel 2' : 'Peligro Crítico'}
                    </h2>
                    <p className="text-gray-500 font-bold flex items-center gap-2">
                       <Clock className="w-4 h-4" /> Última actualización: {new Date(latest?.timestamp).toLocaleTimeString()}
                    </p>
                 </div>
              </div>

              {/* RUL GAUGE */}
              <div className="flex flex-col items-center gap-2 bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white min-w-[200px] shadow-sm">
                 <div className="relative w-32 h-16 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-100 rounded-t-full" />
                    <div 
                      className={cn(
                        "absolute inset-0 rounded-t-full origin-bottom transition-all duration-1000",
                        rul > 30 ? "bg-green-500" : rul > 10 ? "bg-yellow-500" : "bg-red-500"
                      )} 
                      style={{ transform: `rotate(${(1 - rul/60) * 180}deg)` }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-white z-10" />
                 </div>
                 <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">{rul} Días</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RUL (Vida Útil Remanente)</p>
                 </div>
              </div>

              {health !== 'normal' && (
                <button 
                  onClick={handleCreatePdMOrder}
                  className="bg-secondary-900 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 z-30"
                >
                   <PlusCircle className="w-5 h-5" />
                   Generar Orden de Correctivo
                </button>
              )}
           </div>

           {/* REAL-TIME TELEMETRY SENSORS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SensorCard 
                icon={Activity} 
                title="Espectro Vibración" 
                value={latest?.vibration} 
                unit="mm/s" 
                color="blue" 
                limit={limit?.vibration}
              />
              <SensorCard 
                icon={Thermometer} 
                title="Firma Térmica" 
                value={latest?.temperature} 
                unit="°C" 
                color="orange" 
                limit={limit?.temperature}
              />
              <SensorCard 
                icon={Zap} 
                title="Consumo Corriente" 
                value={latest?.current} 
                unit="Amp" 
                color="purple" 
                limit={limit?.current}
              />
           </div>

           {/* MAIN CHART PANEL */}
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                       <TrendingUp className="w-6 h-6 text-primary-500" /> Histórico de Telemetría
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Análisis de los últimos 15 ciclos de lectura</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-primary-500 rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vibración</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-orange-500 rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temperatura</span>
                     </div>
                  </div>
               </div>

               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: '800', fill: '#94a3b8' }} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="vibration" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVib)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                      <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
           </div>

        </div>

      </div>

      {/* MODAL CONFIGURACION DE UMBRALES */}
      {showConfigModal && tempLimits && (
        <div className="fixed inset-0 bg-secondary-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-secondary-900 rounded-xl text-white">
                      <Settings2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Umbrales de Alerta: {selectedAssetId}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración de Disparadores de Seguridad</p>
                   </div>
                </div>
                <button type="button" onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-900 p-2">
                   <PlusCircle className="w-8 h-8 rotate-45" />
                </button>
             </div>

             <div className="p-10 space-y-8">
                {['vibration', 'temperature', 'current'].map(key => (
                  <div key={key} className="space-y-4">
                     <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-[0.2em]">{key === 'vibration' ? 'Vibración (mm/s)' : key === 'temperature' ? 'Temperatura (°C)' : 'Corriente (A)'}</label>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-yellow-600 uppercase">Advertencia (SLA-2)</span>
                           <input 
                             type="number" step="0.1"
                             className="w-full bg-yellow-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 outline-none font-black text-yellow-700"
                             value={tempLimits[key].warning}
                             onChange={e => setTempLimits({...tempLimits, [key]: {...tempLimits[key], warning: parseFloat(e.target.value)}})}
                           />
                        </div>
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-red-600 uppercase">Peligro Crítico (SLA-1)</span>
                           <input 
                             type="number" step="0.1"
                             className="w-full bg-red-50 border-2 border-transparent focus:border-red-400 rounded-2xl p-4 outline-none font-black text-red-700"
                             value={tempLimits[key].danger}
                             onChange={e => setTempLimits({...tempLimits, [key]: {...tempLimits[key], danger: parseFloat(e.target.value)}})}
                           />
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             <div className="p-8 bg-gray-50 flex gap-4 rounded-b-[2.5rem]">
                <button type="button" onClick={() => setShowConfigModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary-200">Guardar Cambios</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SensorCard({ icon: Icon, title, value, unit, color, limit }) {
  const status = value >= limit?.danger ? 'danger' : value >= limit?.warning ? 'warning' : 'normal';
  
  const colors = {
    blue: "text-blue-500 bg-blue-50 border-blue-100",
    orange: "text-orange-500 bg-orange-50 border-orange-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100"
  };

  const statusColors = {
    normal: "bg-green-500 shadow-green-500/30",
    warning: "bg-yellow-500 shadow-yellow-500/30",
    danger: "bg-red-500 shadow-red-500/30 animate-pulse"
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl">
       <div className="flex items-center justify-between mb-6">
          <div className={cn("p-4 rounded-2xl border transition-all group-hover:scale-110", colors[color])}>
             <Icon className="w-6 h-6" />
          </div>
          <div className={cn("w-3 h-3 rounded-full shadow-lg", statusColors[status])} />
       </div>

       <div className="flex items-baseline gap-2">
          <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{value?.toFixed(2) || '---'}</h4>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{unit}</span>
       </div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{title}</p>

       <div className="mt-6 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
             <div 
               className={cn("h-full rounded-full transition-all duration-1000", status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500')} 
               style={{ width: `${Math.min((value / limit?.danger) * 100, 100)}%` }}
             />
          </div>
          <ArrowUpRight className="w-3 h-3 text-gray-300" />
       </div>
       
       {/* Background Decoration */}
       <div className="absolute -bottom-2 -right-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <Icon className="w-24 h-24" />
       </div>
    </div>
  );
}
