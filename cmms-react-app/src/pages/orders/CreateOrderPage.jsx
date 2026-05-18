import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useAssetsStore } from '../../store/useAssetsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, Save, AlertTriangle, Zap, Shield, Clock, Wrench, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CreateOrderPage() {
  const navigate = useNavigate();
  const createOrder = useOrdersStore((state) => state.createOrder);
  const assets = useAssetsStore((state) => state.assets);
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetTag: assets[0]?.tag || 'BMB-01',
    priority: 'P3',
    type: 'preventivo',
  });

  // Group assets by area for the select
  const assetsByArea = assets.reduce((acc, a) => {
    if (!acc[a.area]) acc[a.area] = [];
    acc[a.area].push(a);
    return acc;
  }, {});

  const handleSubmit = (e) => {
    e.preventDefault();
    createOrder({
      ...formData,
      createdBy: user?.name || 'Usuario Externo'
    });
    navigate('/orders');
  };

  const types = [
    { id: 'preventivo', label: 'PM', icon: Shield, color: 'text-green-600 bg-green-50 border-green-100' },
    { id: 'correctivo', label: 'Correctivo', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { id: 'emergencia', label: 'Emergencia', icon: Zap, color: 'text-red-600 bg-red-50 border-red-100' },
    { id: 'mejora', label: 'Mejora', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  ];

  const priorities = [
    { id: 'P1', label: 'P1 - Crítico (2h)', color: 'bg-red-600 text-white shadow-red-200' },
    { id: 'P2', label: 'P2 - Alto (8h)', color: 'bg-orange-500 text-white shadow-orange-200' },
    { id: 'P3', label: 'P3 - Medio (24h)', color: 'bg-yellow-500 text-white shadow-yellow-200' },
    { id: 'P4', label: 'P4 - Bajo (72h)', color: 'bg-green-500 text-white shadow-green-200' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/orders')} 
            className="mr-4 p-3 text-gray-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Levantamiento de Orden de Trabajo</h1>
            <p className="text-gray-500 text-sm font-medium">Capture los detalles de falla para el equipo técnico en planta.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Info */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Información de Cabecera
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título de la Falla / Actividad</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border-2 border-gray-100 rounded-xl p-4 outline-none focus:border-primary-500 text-lg font-bold transition-all"
                    placeholder="Ej: Obstrucción en Bomba de Vacío"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción Detallada (Síntomas)</label>
                  <textarea 
                    required
                    rows={5}
                    className="w-full border-2 border-gray-100 rounded-xl p-4 outline-none focus:border-primary-500 resize-none font-medium text-gray-700 leading-relaxed"
                    placeholder="Indique qué sucedió, cuándo comenzó y qué ruidos o alarmas se presentan..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Type Selector - Touch Friendly */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Clasificación de Trabajo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: t.id})}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-3 overflow-hidden group",
                      formData.type === t.id 
                        ? cn(t.color, "border-current ring-1 ring-current ring-offset-2") 
                        : "border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200"
                    )}
                  >
                    <t.icon className={cn("w-6 h-6", formData.type === t.id ? "animate-bounce" : "group-hover:scale-110 transition-transform")} />
                    <span className="text-xs font-black uppercase tracking-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Asset & Priority Selection */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Logística Industrial</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-4">Equipo (Asset Tag)</label>
                  <select 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 outline-none focus:border-primary-500 font-bold text-primary-700 text-base"
                    value={formData.assetTag}
                    onChange={e => setFormData({...formData, assetTag: e.target.value})}
                  >
                    {Object.entries(assetsByArea).map(([area, areaAssets]) => (
                      <optgroup key={area} label={`── ${area} ──`}>
                        {areaAssets.map(a => (
                          <option key={a.tag} value={a.tag}>
                            {a.tag} — {a.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-4">Prioridad / Nivel SLA</label>
                  <div className="space-y-3">
                    {priorities.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p.id})}
                        className={cn(
                          "w-full p-4 rounded-xl text-left font-black transition-all flex items-center justify-between border-2",
                          formData.priority === p.id 
                            ? cn(p.color, "border-white ring-2 ring-gray-900") 
                            : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        <span className="text-sm">{p.label}</span>
                        {formData.priority === p.id && <Zap className="w-4 h-4 fill-current" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center z-50 md:static md:bg-transparent md:border-none md:p-0">
          <div className="flex gap-4 w-full max-w-4xl">
            <button 
              type="button" 
              onClick={() => navigate('/orders')}
              className="flex-1 py-4 text-gray-600 hover:bg-white hover:shadow-sm font-black uppercase tracking-widest text-xs rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <Save className="w-5 h-5" />
              Generar Orden de Trabajo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
