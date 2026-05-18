import { useState, useMemo } from 'react';
import { usePreventiveStore } from '../../store/usePreventiveStore';
import { useAssetsStore } from '../../store/useAssetsStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical,
  Timer,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Wrench,
  Package,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export function PreventivePage() {
  const navigate = useNavigate();
  const { plans, createPlan, executePlan } = usePreventiveStore();
  const createOrder = useOrdersStore(s => s.createOrder);
  const { assets } = useAssetsStore();
  const [view, setView] = useState('list'); // 'list' | 'calendar' | 'gantt'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    assetId: assets[0]?.tag || '',
    type: 'tiempo',
    intervalDays: '30',
    intervalHours: '500',
    estimatedHours: '2',
    checklist: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleExecute = (planId) => {
    const plan = executePlan(planId);
    if (plan) {
      // Crear la OT vinculada
      createOrder({
        title: `Mantenimiento Preventivo: ${plan.name}`,
        description: `Rutina programada. Checklist: ${plan.checklist.join(', ')}`,
        assetTag: plan.assetId,
        priority: 'P2',
        type: 'preventivo'
      });
      navigate('/orders');
    }
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (newPlan.checklist.length === 0) return alert('Debes agregar al menos una tarea al checklist.');
    createPlan(newPlan);
    setShowNewModal(false);
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setNewPlan({ ...newPlan, checklist: [...newPlan.checklist, newChecklistItem.trim()] });
      setNewChecklistItem('');
    }
  };

  // --- LOGICA DE SEMAFORO Y METRICAS ---
  const getPlanStatus = (plan) => {
    const asset = assets.find(a => a.tag === plan.assetId);
    const now = new Date();
    
    if (plan.type === 'tiempo') {
      const dueDate = new Date(plan.nextDueDate);
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'red';
      if (diffDays <= 7) return 'yellow';
      return 'green';
    } else {
      if (!asset) return 'green';
      const remainingHours = plan.nextDueHours - asset.currentHours;
      if (remainingHours <= 0) return 'red';
      if (remainingHours <= (plan.intervalHours * 0.1)) return 'yellow';
      return 'green';
    }
  };

  const getComplianceData = useMemo(() => {
    return plans.map(p => ({
      name: p.name.split(' ').slice(0, 2).join(' '),
      compliance: p.compliance,
      status: getPlanStatus(p)
    }));
  }, [plans]);

  const stats = {
    green: plans.filter(p => getPlanStatus(p) === 'green').length,
    yellow: plans.filter(p => getPlanStatus(p) === 'yellow').length,
    red: plans.filter(p => getPlanStatus(p) === 'red').length,
  };

  // --- LOGICA DE CALENDARIO ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const monthName = currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4">
      {/* INDUSTRIAL HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-primary-600 rounded-lg shadow-lg shadow-primary-200">
               <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Plan Maestro Preventivo</h1>
          </div>
          <p className="text-gray-500 font-medium ml-12">Gestión estratégica de la confiabilidad y preservación de activos industriales.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:ml-12">
          {/* View Toggle */}
          <div className="bg-white p-1 rounded-2xl flex shadow-sm border border-gray-100">
            {[
              { id: 'list', label: 'Listado', icon: LayoutGrid },
              { id: 'calendar', label: 'Calendario', icon: Calendar },
              { id: 'gantt', label: 'Anual (Gantt)', icon: Activity }
            ].map(v => (
              <button 
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  view === v.id ? "bg-secondary-900 text-white shadow-xl" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-100 transition-all active:scale-95 ml-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Rutina
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: STATS & ANALYTICS */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Traffic Light Mini */}
          <div className="bg-secondary-900 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <ShieldCheck className="w-32 h-32 rotate-12" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary-400 mb-6 flex items-center gap-2">
               <Activity className="w-3 h-3" /> Estado de Salud Plan
             </h3>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                      <span className="text-sm font-bold">AL DÍA</span>
                   </div>
                   <span className="text-xl font-black">{stats.green}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_12px_rgba(234,179,8,0.6)]" />
                      <span className="text-sm font-bold">PRÓXIMOS</span>
                   </div>
                   <span className="text-xl font-black">{stats.yellow}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse" />
                      <span className="text-sm font-bold">VENCIDOS</span>
                   </div>
                   <span className="text-xl font-black">{stats.red}</span>
                </div>
             </div>
          </div>

          {/* Compliance Chart Mini */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumplimiento por Rutina</h3>
                <TrendingDown className="w-4 h-4 text-primary-500" />
             </div>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getComplianceData} layout="vertical" margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px', fontWeight: '800', fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="compliance" radius={[0, 4, 4, 0]} barSize={16}>
                      {getComplianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.status === 'red' ? '#ef4444' : entry.status === 'yellow' ? '#eab308' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
             <p className="text-[10px] font-black text-amber-600 uppercase mb-3 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> Recomendación IA CMMS
             </p>
             <p className="text-xs text-amber-900 leading-relaxed font-bold">
               Basado en el historial de fallas, se recomienda acortar el intervalo de <span className="text-amber-700 underline">Lubricación Motor BMB-01</span> de 30 a 25 días.
             </p>
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN VIEW */}
        <div className="xl:col-span-3">
          
          {view === 'list' && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {plans.map(plan => {
                const asset = assets.find(a => a.tag === plan.assetId);
                const status = getPlanStatus(plan);
                
                return (
                  <div key={plan.id} className={cn(
                    "group bg-white rounded-3xl border-2 transition-all hover:shadow-xl",
                    status === 'red' ? "border-red-100" : status === 'yellow' ? "border-yellow-100" : "border-gray-50"
                  )}>
                    <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                       {/* Plan Visual Identity */}
                       <div className="lg:w-1/3 flex flex-col justify-between">
                          <div className="flex gap-4">
                             <div className={cn(
                               "p-4 rounded-3xl shadow-lg flex-shrink-0",
                               plan.type === 'tiempo' ? "bg-blue-600 text-white shadow-blue-100" : "bg-purple-600 text-white shadow-purple-100"
                             )}>
                               {plan.type === 'tiempo' ? <Calendar className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                             </div>
                             <div>
                               <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors truncate">{plan.name}</h3>
                               <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 font-mono tracking-tighter">
                                    {plan.assetId}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 capitalize bg-gray-50 px-2 py-0.5 rounded">
                                    {plan.type}
                                  </span>
                               </div>
                             </div>
                          </div>

                          <div className="mt-8 space-y-2">
                             <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                               <span>Cumplimiento del Plan</span>
                               <span>{plan.compliance}%</span>
                             </div>
                             <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                <div 
                                  className={cn("h-full rounded-full transition-all duration-1000", status === 'red' ? 'bg-red-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500')} 
                                  style={{ width: `${plan.compliance}%` }}
                                />
                             </div>
                          </div>
                       </div>

                       {/* Details & Specs */}
                       <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-50">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><Timer className="w-4 h-4 text-secondary-500" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Próximo Vencimiento</p>
                                   <p className={cn("text-sm font-black", status === 'red' ? "text-red-600" : "text-gray-900")}>
                                      {plan.type === 'tiempo' ? new Date(plan.nextDueDate).toLocaleDateString() : `${plan.nextDueHours} Horas`}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><Wrench className="w-4 h-4 text-secondary-500" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Esfuerzo Estimado</p>
                                   <p className="text-sm font-black text-gray-900">{plan.estimatedHours} h Técnico</p>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><Package className="w-4 h-4 text-secondary-500" /></div>
                                <div>
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Refacciones Necesarias</p>
                                   <div className="flex flex-wrap gap-1 mt-1">
                                      {plan.requiredParts?.length > 0 ? plan.requiredParts.map(p => (
                                         <span key={p.id} className="text-[9px] font-bold bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-100 truncate max-w-[100px]">{p.name} (x{p.qty})</span>
                                      )) : <p className="text-[10px] text-gray-400 font-bold italic">No requiere</p>}
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleExecute(plan.id)}
                                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-primary-600 hover:text-white transition-all rounded-xl shadow-sm border border-gray-100 group/btn"
                                >
                                   <span className="text-[10px] font-black uppercase tracking-widest">Ejecutar Mantenimiento</span>
                                   <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'calendar' && (
            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500 h-[800px] flex flex-col">
              <div className="p-8 bg-secondary-900 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl"><Calendar className="w-6 h-6" /></div>
                   <h3 className="text-2xl font-black uppercase tracking-widest">{monthName}</h3>
                </div>
                <div className="flex gap-3">
                  <button onClick={prevMonth} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-all"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={nextMonth} className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-all"><ChevronRight className="w-6 h-6" /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
                {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                  <div key={d} className="py-4 text-center text-[10px] font-black text-gray-400 tracking-[0.2em]">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1">
                {calendarDays.map((day, i) => {
                  const dateKey = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0] : null;
                  const dayPlans = plans.filter(p => p.type === 'tiempo' && p.nextDueDate.startsWith(dateKey));

                  return (
                    <div key={i} className={cn(
                      "border-r border-b border-gray-100 p-3 transition-all relative group",
                      !day ? 'bg-gray-50/50' : 'hover:bg-primary-50/20'
                    )}>
                      {day && (
                        <>
                          <span className={cn(
                             "text-sm font-black",
                             day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? "text-primary-600 flex items-center justify-center w-8 h-8 rounded-full bg-primary-50" : "text-gray-300 group-hover:text-gray-500"
                          )}>
                            {day}
                          </span>
                          <div className="mt-3 space-y-1.5 h-[100px] overflow-y-auto custom-scrollbar">
                            {dayPlans.map(p => {
                              const status = getPlanStatus(p);
                              return (
                                <div key={p.id} className={cn(
                                   "text-[9px] text-white font-black p-2 rounded-xl shadow-lg shadow-white/50 truncate flex items-center gap-2",
                                   status === 'red' ? 'bg-red-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                                )}>
                                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                  {p.name}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'gantt' && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col">
              <div className="p-8 bg-secondary-900 flex justify-between items-center text-white">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-[0.2em]">Planeación Anual {new Date().getFullYear()}</h3>
                    <p className="text-secondary-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Distribución de carga de trabajo por mes</p>
                 </div>
                 <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[10px] font-bold uppercase">
                       <div className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" /> Rutina Programada
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-20 w-80">Activo / Rutina</th>
                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m) => (
                        <th key={m} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-l border-gray-100">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plans.map(plan => (
                      <tr key={plan.id} className="hover:bg-primary-50/20 transition-colors group">
                        <td className="p-6 sticky left-0 bg-white group-hover:bg-primary-50/20 z-10 border-r border-gray-50">
                           <p className="text-xs font-black text-gray-900 line-clamp-1">{plan.name}</p>
                           <p className="text-[9px] font-bold text-primary-600 mt-1 uppercase tracking-tighter">{plan.assetId}</p>
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(monthIdx => {
                          // Lógica para marcar meses de intervención (ejemplo simplificado basado en el intervalo de meses)
                          const hasTask = plan.type === 'uso' 
                            ? (monthIdx % 2 === 0) // Simulación para uso
                            : (monthIdx % (plan.intervalDays > 30 ? 3 : 1) === 0); // Simulación para tiempo
                          
                          return (
                            <td key={monthIdx} className="p-4 border-l border-gray-50">
                               <div className="flex justify-center">
                                  {hasTask ? (
                                    <div className="group/dot relative">
                                      <div className={cn(
                                        "w-4 h-4 rounded-full shadow-sm transition-all hover:scale-125 cursor-help",
                                        plan.type === 'tiempo' ? "bg-primary-500" : "bg-purple-500"
                                      )} />
                                      {/* Tooltip Industrial */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50">
                                         <div className="bg-secondary-900 text-white text-[9px] p-2 rounded-lg shadow-xl whitespace-nowrap border border-white/10 font-bold uppercase tracking-widest">
                                            Ejecución Estimada
                                         </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-1 h-1 bg-gray-100 rounded-full" />
                                  )}
                               </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-8">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-secondary-600">Mantenimiento Basado en Tiempo (TBM)</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-secondary-600">Mantenimiento Basado en Uso (UBM)</span>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL NUEVO PLAN - OPTIMIZED FOR INDUSTRIAL INPUT */}
      {showNewModal && (
        <div className="fixed inset-0 bg-secondary-900/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleCreatePlan} className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-6">
                  <div className="p-5 bg-primary-600 rounded-3xl shadow-xl shadow-primary-200">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Nueva Rutina Maestra</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Configuración de Confiabilidad de Activos</p>
                  </div>
               </div>
               <button type="button" onClick={() => setShowNewModal(false)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-all hover:rotate-90">
                 <Plus className="w-6 h-6 rotate-45" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  
                  {/* Left Column: Core Data */}
                  <div className="space-y-8">
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Identificación de la Rutina</label>
                        <input 
                           type="text" required
                           className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 outline-none font-black text-xl transition-all"
                           placeholder="Ej: Cambio de Valvulería CNC"
                           value={newPlan.name}
                           onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Activo Objetivo</label>
                           <select 
                              className="w-full bg-gray-100 rounded-2xl p-4 outline-none font-bold text-gray-700"
                              value={newPlan.assetId}
                              onChange={e => setNewPlan({...newPlan, assetId: e.target.value})}
                           >
                              {assets.map(a => <option key={a.id} value={a.tag}>{a.tag} - {a.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Esfuerzo (HH)</label>
                           <input 
                              type="number" step="0.5"
                              className="w-full bg-gray-100 rounded-2xl p-4 outline-none font-bold text-gray-700"
                              placeholder="2.5"
                              value={newPlan.estimatedHours}
                              onChange={e => setNewPlan({...newPlan, estimatedHours: e.target.value})}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Disparador de Ejecución</label>
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             type="button"
                             onClick={() => setNewPlan({...newPlan, type: 'tiempo'})}
                             className={cn(
                               "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                               newPlan.type === 'tiempo' ? "bg-white border-primary-500 shadow-xl shadow-primary-50 text-primary-600" : "bg-gray-50 border-transparent text-gray-400"
                             )}
                           >
                             <Calendar className="w-6 h-6" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Calendario</span>
                           </button>
                           <button 
                             type="button"
                             onClick={() => setNewPlan({...newPlan, type: 'uso'})}
                             className={cn(
                               "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                               newPlan.type === 'uso' ? "bg-white border-purple-500 shadow-xl shadow-purple-50 text-purple-600" : "bg-gray-50 border-transparent text-gray-400"
                             )}
                           >
                             <Activity className="w-6 h-6" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Uso (Horas)</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Execution Checklist */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500" /> Secuencia Técnica de Ejecución
                    </label>
                    
                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 bg-white border-2 border-transparent focus:border-primary-500 rounded-xl p-3 text-sm font-bold shadow-sm outline-none"
                            placeholder="Describa el paso técnico..."
                            value={newChecklistItem}
                            onChange={e => setNewChecklistItem(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                          />
                          <button 
                            type="button"
                            onClick={addChecklistItem}
                            className="bg-primary-600 text-white p-3 rounded-xl shadow-lg shadow-primary-100 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {newPlan.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-primary-100 transition-all shadow-sm group">
                               <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                  <span className="text-sm font-bold text-gray-700">{item}</span>
                               </div>
                               <button 
                                  type="button"
                                  onClick={() => setNewPlan({...newPlan, checklist: newPlan.checklist.filter((_, i) => i !== idx)})}
                                  className="text-gray-200 hover:text-red-500 transition-colors"
                               >
                                  <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                          ))}
                          {newPlan.checklist.length === 0 && (
                             <div className="py-12 flex flex-col items-center justify-center opacity-30 italic font-medium text-gray-400">
                                <ClipboardList className="w-12 h-12 mb-2" />
                                <p>No hay pasos definidos</p>
                             </div>
                          )}
                        </div>
                    </div>
                  </div>

               </div>
            </div>

            <div className="p-8 md:p-12 bg-gray-50/50 flex gap-4">
               <button 
                 type="button" 
                 onClick={() => setShowNewModal(false)}
                 className="flex-1 py-5 text-gray-600 font-black uppercase tracking-widest text-[10px] hover:bg-white rounded-3xl transition-all"
               >
                 Descartar
               </button>
               <button 
                 type="submit"
                 className="flex-[2] py-5 bg-primary-600 text-white font-black uppercase tracking-widest text-xs rounded-3xl shadow-2xl shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all"
               >
                 Protocolizar Plan Maestro
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
