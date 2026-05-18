import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAssetsStore } from '../../store/useAssetsStore';
import { 
  ArrowLeft, Play, CheckCircle, Clock, AlertTriangle, ShieldCheck, 
  DollarSign, Timer, CheckSquare, Square, ClipboardList, LightbulbIcon,
  Activity, FileText
} from 'lucide-react';
import { generateOrderPDF } from '../../lib/pdfGenerator';

const STATUS_FLOW = ['abierta', 'asignada', 'en_proceso', 'en_espera', 'cerrada'];

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useOrdersStore((state) => state.orders.find(o => o.id === id));
  const updateStatus = useOrdersStore((state) => state.updateOrderStatus);
  const { assets, updateAssetHours } = useAssetsStore();
  const user = useAuthStore((state) => state.user);

  // Form states for Closure
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [whys, setWhys] = useState(['', '', '', '', '']);
  const [downtime, setDowntime] = useState('');
  const [impact, setImpact] = useState('bajo');
  const [cost, setCost] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [failureCause, setFailureCause] = useState('');
  const [localChecklist, setLocalChecklist] = useState(order?.checklist || []);

  if (!order) return <div className="p-8 text-center">Orden no encontrada</div>;

  const isOverdue = order.status !== 'cerrada' && new Date(order.dueDate) < new Date();
  const isP1 = order.priority === 'P1';
  const asset = assets.find(a => a.tag === order.assetTag);

  useEffect(() => {
    if (order.checklist) setLocalChecklist(order.checklist);
  }, [order]);

  const handleAdvance = () => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[idx + 1];

    if (nextStatus === 'cerrada') {
      // Validar checklist si es preventivo
      if (order.type === 'preventivo' && localChecklist.some(item => !item.completed)) {
        return alert('Debes completar todos los puntos del checklist obligatorio antes de cerrar.');
      }
      setShowClosureForm(true);
    } else if (idx < STATUS_FLOW.length - 1) {
      updateStatus(id, nextStatus);
    }
  };

  const handleCompleteClosure = (e) => {
    e.preventDefault();
    if (whys[0].length < 5) return alert('Debes completar al menos el primer ¿Por qué? del análisis de causa raíz.');
    if (order.type !== 'preventivo' && !failureCause) return alert('Debes seleccionar una Causa de Falla para aprender del histórico.');
    
    // Actualizar horómetro del activo
    if (asset && meterReading) {
      updateAssetHours(asset.id, parseFloat(meterReading));
    }

    // Business Logic: Apply impact to Asset Health
    useAssetsStore.getState().applyOTImpactToHealth(order.assetTag, order.type);

    updateStatus(id, 'cerrada', {
      rootCause: whys.filter(w => w.length > 0),
      failureCause: order.type === 'preventivo' ? 'Mantenimiento Preventivo' : failureCause,
      downtime: parseFloat(downtime),
      impact,
      totalCost: parseFloat(cost),
      meterReading: parseFloat(meterReading),
      checklist: localChecklist
    });
    setShowClosureForm(false);
  };

  const toggleChecklistItem = (index) => {
    const nextList = [...localChecklist];
    nextList[index].completed = !nextList[index].completed;
    setLocalChecklist(nextList);
  };

  const isTechnician = user?.role === 'tecnico';

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={() => navigate('/orders')} className="mr-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-primary-600 font-mono font-bold text-sm bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                {order.folio}
              </span>
              {isP1 && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded animate-pulse">URGENTE P1</span>}
            </div>
            <h1 className="text-2xl font-bold mt-1 text-gray-900">{order.title}</h1>
          </div>
        </div>
        
        {/* SLA Countdown indicator (Mock logic) */}
        {!order.closure ? (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${isOverdue ? 'border-red-500 bg-red-50 text-red-700' : 'border-green-500 bg-green-50 text-green-700'}`}>
            <Clock className="w-5 h-5" />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest">{isOverdue ? 'SLA VENCIDO' : 'DENTRO DE SLA'}</p>
              <p className="text-sm font-black">{new Date(order.dueDate).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => generateOrderPDF(order)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <FileText className="w-5 h-5 text-indigo-400" />
            Descargar Reporte PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Failure description */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Reporte de Falla
            </h3>
            <p className="text-gray-800 text-lg leading-relaxed">{order.description}</p>
          </div>

          {/* Checklist Section (for Preventives) */}
          {order.type === 'preventivo' && order.status !== 'cerrada' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ClipboardList className="w-4 h-4 text-primary-400" />
                 Checklist Obligatorio
               </h3>
               <div className="space-y-3">
                 {localChecklist.map((item, idx) => (
                   <div 
                    key={idx} 
                    onClick={() => toggleChecklistItem(idx)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${item.completed ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}`}
                   >
                     {item.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                     <span className="font-bold">{item.task}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Root Cause Section (if closed) */}
          {order.closure && (
             <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-inner">
               <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5" />
                 Análisis Causa Raíz (Finalizado)
               </h3>
               <div className="space-y-3">
                 {order.closure.rootCause.map((w, i) => (
                   <div key={i} className="flex gap-4 items-center">
                     <span className="w-8 h-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xs">W{i+1}</span>
                     <p className="text-green-900 font-medium">{w}</p>
                   </div>
                 ))}
               </div>
               <div className="mt-6 grid grid-cols-3 gap-4 border-t border-green-200 pt-4">
                  <div className="text-center">
                    <p className="text-[10px] text-green-600 font-bold uppercase">Downtime</p>
                    <p className="text-lg font-black text-green-900">{order.closure.downtime} min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-green-600 font-bold uppercase">Impacto</p>
                    <p className="text-lg font-black text-green-900 capitalize">{order.closure.impact}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-green-600 font-bold uppercase">Costo Total</p>
                    <p className="text-lg font-black text-green-900">${order.closure.totalCost}</p>
                  </div>
               </div>
             </div>
          )}

          {/* Workflow Buttons */}
          {order.status !== 'cerrada' && !showClosureForm && (
            <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-primary-100">
               <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <Play className="w-5 h-5 text-primary-500" />
                 Panel de Avance Industrial
               </h3>
               <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleAdvance}
                    className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 font-bold transition-all transform active:scale-95"
                  >
                    {order.status === 'abierta' && "ASIGNAR A MÍ"}
                    {order.status === 'asignada' && "INICIAR INTERVENCIÓN"}
                    {order.status === 'en_proceso' && "SOLICITAR CIERRE / REPARADO"}
                    {order.status === 'en_espera' && "REANUDAR TRABAJO"}
                  </button>
                  {order.status === 'en_proceso' && (
                    <button 
                      onClick={() => updateStatus(id, 'en_espera')}
                      className="w-full py-4 text-orange-700 font-bold border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      PONER EN ESPERA (Falta de Refacción / Externo)
                    </button>
                  )}
               </div>
            </div>
          )}

          {/* INTELLIGENT CLOSURE FORM */}
          {showClosureForm && (
            <form onSubmit={handleCompleteClosure} className="bg-white p-8 rounded-2xl shadow-xl border-2 border-green-500 animate-in zoom-in-95">
               <div className="flex justify-between items-start mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Cierre Técnico & Análisis 5 Why</h3>
                 <button type="button" onClick={() => setShowClosureForm(false)} className="text-gray-400 hover:text-black">✖</button>
               </div>

               {/* Failure Cause & Knowledge Base */}
               {order.type !== 'preventivo' && (
                 <div className="mb-8">
                   <label className="block text-xs font-black text-gray-500 uppercase mb-3">Causa de la Falla (Aprendizaje del Sistema)</label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <select 
                       required
                       className="w-full p-3 border-2 border-primary-100 rounded-xl outline-none focus:border-primary-500 bg-white font-bold"
                       value={failureCause}
                       onChange={e => setFailureCause(e.target.value)}
                     >
                       <option value="">Seleccione causa...</option>
                       <option value="Desgaste Natural">Desgaste Natural</option>
                       <option value="Falta de Lubricación">Falta de Lubricación</option>
                       <option value="Error de Operación">Error de Operación</option>
                       <option value="Falla Eléctrica">Falla Eléctrica</option>
                       <option value="Fatiga de Material">Fatiga de Material</option>
                       <option value="Sobrecalentamiento">Sobrecalentamiento</option>
                       <option value="Vandalismo / Sabotaje">Vandalismo / Sabotaje</option>
                     </select>

                     <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                       <p className="text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                         <LightbulbIcon className="w-3 h-3" /> Sugerencias del Histórico
                       </p>
                       <div className="space-y-1">
                         {useOrdersStore.getState().getFailureSolutions(order.assetTag).slice(0, 2).map((sol, idx) => (
                           <div key={idx} className="text-xs text-amber-900">
                             En <span className="font-bold">{sol.count}</span> casos de <span className="italic">{sol.cause}</span> se resolvió con: <span className="font-bold">{sol.suggestedActions[0]}</span>
                           </div>
                         ))}
                         {useOrdersStore.getState().getFailureSolutions(order.assetTag).length === 0 && (
                           <p className="text-xs text-amber-600 italic">No hay datos históricos previos para este activo.</p>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* 5 Whys */}
               <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                 <div className="flex justify-between items-center mb-4">
                   <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 leading-none">
                     <AlertTriangle className="w-4 h-4 text-orange-400" /> 
                     Investigación de Causa Raíz Obligatoria
                   </p>
                   <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-200 text-gray-400">ANÁLISIS 5 WHY</span>
                 </div>
                 {whys.map((why, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center border border-primary-200 italic">#{idx+1}</div>
                        {idx < 4 && <div className="w-0.5 h-full bg-primary-100"></div>}
                      </div>
                      <input 
                        type="text" 
                        required={idx === 0}
                        placeholder={`¿Por qué sucedió el punto anterior?`}
                        className="flex-1 bg-transparent border-b-2 border-gray-200 focus:border-primary-500 outline-none pb-1 text-sm font-medium"
                        value={why}
                        onChange={(e) => {
                          const newWhys = [...whys];
                          newWhys[idx] = e.target.value;
                          setWhys(newWhys);
                        }}
                      />
                    </div>
                 ))}
               </div>

               {/* Metrics */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 text-primary-600">Lectura Horómetro Actual</label>
                    <div className="relative">
                      <Timer className="absolute left-3 top-2.5 w-4 h-4 text-primary-400" />
                      <input 
                        type="number" 
                        required 
                        placeholder={`Última: ${asset?.currentHours || 0} h`}
                        className="w-full pl-9 pr-3 py-2 border-2 border-primary-100 rounded-lg outline-none focus:border-primary-500 font-bold" 
                        value={meterReading} 
                        onChange={e => setMeterReading(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2">Tiempo Muerto (Minutos)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input type="number" required className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" value={downtime} onChange={e => setDowntime(e.target.value)} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2">Impacto Producción</label>
                    <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" value={impact} onChange={e => setImpact(e.target.value)}>
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                      <option value="paro_total">Paro de Línea Total</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2">Costo Falla (Manual)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input type="number" required className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-bold text-green-700" value={cost} onChange={e => setCost(e.target.value)} />
                    </div>
                  </div>
               </div>

               <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-green-700">
                 FINALIZAR Y CERRAR ORDEN
               </button>
            </form>
          )}
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-widest border-b pb-2">Especificaciones</h3>
            <div className="space-y-4 text-sm">
               <div className="flex justify-between items-center">
                 <span className="text-gray-500">Estado Industrial:</span>
                 <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${order.status === 'cerrada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                   {order.status.replace('_', ' ')}
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500">Prioridad / SLA:</span>
                 <span className={`font-black p-1 rounded ${order.priority === 'P1' ? 'text-red-600' : 'text-gray-900'}`}>{order.priority}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500">Asset Tag:</span>
                 <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-primary-700 font-bold">{order.assetTag}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-500">Elaborado por:</span>
                 <span className="font-bold text-gray-800">{order.createdBy || 'Sistema'}</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-dashed">
                 <span className="text-gray-500 italic">Fecha Reporte:</span>
                 <span className="text-xs">{new Date(order.createdAt).toLocaleString()}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
