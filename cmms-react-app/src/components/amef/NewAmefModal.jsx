import { useState, useEffect } from 'react';
import { X, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAmefStore } from '../../store/useAmefStore';
import { useAssetsStore } from '../../store/useAssetsStore';

export function NewAmefModal({ isOpen, onClose }) {
  const addAmefAnalysis = useAmefStore((state) => state.addAmefAnalysis);
  const assets = useAssetsStore((state) => state.assets);
  
  const [formData, setFormData] = useState({
    assetTag: assets[0]?.tag || '',
    failureMode: '',
    failureEffect: '',
    failureCause: '',
    severity: 1,
    occurrence: 1,
    detection: 1,
    recommendedAction: '',
    newSeverity: 1,
    newOccurrence: 1,
    newDetection: 1
  });

  const [npr, setNpr] = useState(1);
  const [newNPR, setNewNPR] = useState(1);

  useEffect(() => {
    setNpr(formData.severity * formData.occurrence * formData.detection);
    setNewNPR(formData.newSeverity * formData.newOccurrence * formData.newDetection);
  }, [formData.severity, formData.occurrence, formData.detection, formData.newSeverity, formData.newOccurrence, formData.newDetection]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addAmefAnalysis(formData);
    onClose();
  };

  const getNprColor = (val) => {
    if (val >= 200) return 'text-red-600';
    if (val >= 120) return 'text-orange-600';
    if (val >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b flex justify-between items-center text-white bg-slate-900">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Análisis de Modo y Efecto de Falla (AMEF)
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Column: Context & Mode */}
            <div className="md:col-span-7 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipo</label>
                  <select 
                    name="assetTag" 
                    value={formData.assetTag} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:border-primary-500 outline-none font-medium"
                  >
                    {assets.map(a => <option key={a.tag} value={a.tag}>{a.tag} — {a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modo de Falla</label>
                   <input type="text" name="failureMode" value={formData.failureMode} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="¿Cómo falla?" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Efecto de la Falla</label>
                   <input type="text" name="failureEffect" value={formData.failureEffect} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="¿Qué impacto tiene?" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Causa Raíz</label>
                   <textarea name="failureCause" value={formData.failureCause} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" rows="2" placeholder="¿Por qué ocurre?" />
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <label className="block text-xs font-bold text-primary-700 uppercase mb-2">Plan de Acción / Mitigación</label>
                  <textarea 
                    name="recommendedAction" 
                    value={formData.recommendedAction} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-2 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" 
                    rows="3" 
                    placeholder="Describe la mejora de ingeniería o mantenimiento preventivo..." 
                  />
              </div>
            </div>

            {/* Right Column: NPR Scoring (Original vs Revised) */}
            <div className="md:col-span-5 space-y-6">
              
              {/* Original Scoring */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                <h4 className="text-xs font-black text-gray-400 uppercase mb-4 text-center tracking-widest">Situación Actual</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">S</label>
                    <input type="number" min="1" max="10" name="severity" value={formData.severity} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-red-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">O</label>
                    <input type="number" min="1" max="10" name="occurrence" value={formData.occurrence} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-orange-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">D</label>
                    <input type="number" min="1" max="10" name="detection" value={formData.detection} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-yellow-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-400">NPR ACTUAL</span>
                  <span className={`text-4xl font-black ${getNprColor(npr)}`}>{npr}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-gray-100 p-2 rounded-full">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Revised Scoring */}
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-black text-emerald-600 uppercase mb-4 text-center tracking-widest">Post-Mitigación</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">S</label>
                    <input type="number" min="1" max="10" name="newSeverity" value={formData.newSeverity} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-emerald-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">O</label>
                    <input type="number" min="1" max="10" name="newOccurrence" value={formData.newOccurrence} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-emerald-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                  <div className="text-center">
                    <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">D</label>
                    <input type="number" min="1" max="10" name="newDetection" value={formData.newDetection} onChange={handleChange} required className="w-full text-center py-2 border-2 border-white rounded-xl focus:border-emerald-500 outline-none font-black text-xl bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-emerald-600">NPR ESTIMADO</span>
                  <span className={`text-4xl font-black text-emerald-700`}>{newNPR}</span>
                  <span className="text-[9px] font-bold text-emerald-500 mt-1 uppercase">Reducción de {(((npr - newNPR) / npr) * 100).toFixed(0)}%</span>
                </div>
              </div>

            </div>

          </div>

          <div className="pt-8 mt-8 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-8 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95">
              Guardar Análisis de Riesgo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
