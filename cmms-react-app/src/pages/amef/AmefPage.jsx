import { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle, Clock, Plus, BarChart2 } from 'lucide-react';
import { useAmefStore } from '../../store/useAmefStore';
import { AmefTable } from '../../components/amef/AmefTable';
import { NewAmefModal } from '../../components/amef/NewAmefModal';
import { AmefCharts } from '../../components/amef/AmefCharts';

export function AmefPage() {
  const { amefs, getKPIs } = useAmefStore();
  const kpis = getKPIs();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sorting
  const sortedAmefs = [...amefs].sort((a, b) => b.npr - a.npr);

  const kpiCards = [
    { name: 'Total Análisis', value: kpis.total, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'NPR Críticos (≥200)', value: kpis.critical, icon: AlertTriangle, color: kpis.critical > 0 ? 'text-red-600' : 'text-green-600', bg: kpis.critical > 0 ? 'bg-red-100' : 'bg-green-100' },
    { name: 'NPR Altos (≥120)', value: kpis.high, icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Impactos Implementados', value: kpis.implemented, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis AMEF / RCM</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis de Modo y Efecto de Fallas. Evalúa y mitiga riesgos (NPR).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Análisis
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Average NPR Summary Banner */}
      <div className="bg-slate-800 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg">
         <div>
            <h3 className="text-lg font-bold">NPR Promedio Global</h3>
            <p className="text-slate-400 text-sm">Nivel de riesgo estimado para toda la planta antes y después de mitigar.</p>
         </div>
         <div className="flex items-center gap-8 mt-4 md:mt-0">
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Diagnóstico Original</p>
              <span className={`text-4xl font-black ${kpis.avgNPR >= 150 ? 'text-red-400' : 'text-slate-100'}`}>
                {kpis.avgNPR.toFixed(0)}
              </span>
            </div>
            {kpis.avgNewNPR > 0 && (
              <>
                <div className="text-slate-500">→</div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Post-Ingeniería</p>
                  <span className="text-4xl font-black text-emerald-400">
                    {kpis.avgNewNPR.toFixed(0)}
                  </span>
                </div>
              </>
            )}
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">📋 Matriz AMEF</h3>
        </div>
        <AmefTable amefs={sortedAmefs} />
      </div>

      <AmefCharts amefs={amefs} />

      <NewAmefModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
