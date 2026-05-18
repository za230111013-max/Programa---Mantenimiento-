import { Calendar, AlertCircle, Clock, Timer, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

const priorityConfig = {
  P1: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    text: 'text-red-700', 
    indicator: 'bg-red-600',
    iconColor: 'text-red-600',
    slug: 'CRÍTICO'
  },
  P2: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    text: 'text-orange-700', 
    indicator: 'bg-orange-500',
    iconColor: 'text-orange-500',
    slug: 'ALTO'
  },
  P3: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-700', 
    indicator: 'bg-blue-500', 
    iconColor: 'text-blue-500',
    slug: 'NORMAL'
  },
  P4: { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    text: 'text-emerald-700', 
    indicator: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    slug: 'BAJO'
  }
};

export function OrderCard({ order, onClick }) {
  const isOverdue = order.status !== 'cerrada' && new Date(order.dueDate) < new Date();
  const config = priorityConfig[order.priority] || priorityConfig.P3;
  const isP1 = order.priority === 'P1';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden bg-white p-4 rounded-2xl shadow-sm border-2 cursor-pointer transition-all duration-200",
        "hover:shadow-xl hover:-translate-y-1 hover:border-primary-300",
        isOverdue ? 'border-red-500 bg-red-50/30' : 'border-gray-100'
      )}
    >
      {/* Priority Badge Indicator */}
      <div className={cn("absolute top-0 left-0 px-3 py-1 rounded-br-xl text-[9px] font-black tracking-widest text-white shadow-sm z-10", config.indicator)}>
        {config.slug}
      </div>

      {/* P1 High Pressure Animation */}
      {isP1 && order.status !== 'cerrada' && (
        <div className="absolute top-2 right-2 animate-pulse">
           <Zap className="w-5 h-5 text-red-600 fill-red-600" />
        </div>
      )}

      <div className="mt-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
            {order.folio}
          </span>
          <span className="text-[10px] font-bold text-gray-400 capitalize bg-gray-50 px-2 py-0.5 rounded">
            {order.type}
          </span>
        </div>
        
        <h4 className="font-black text-sm text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
          {order.title}
        </h4>
      </div>

      <div className="bg-gray-50/80 rounded-xl p-3 mb-4 border border-gray-100 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white shadow-inner", config.iconColor)}>
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Equipo</p>
          <p className="text-xs font-black text-gray-800">{order.assetTag}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="flex items-center text-[10px] text-gray-500 font-bold">
             <Calendar className="w-3 h-3 mr-1 text-gray-400" />
             {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
           </div>
           {order.status !== 'cerrada' && (
             <div className={cn("flex items-center text-[10px] font-black", isOverdue ? "text-red-600 animate-bounce" : "text-gray-400")}>
               <Timer className="w-3 h-3 mr-1" />
               {isOverdue ? "VENCIDO" : "EN TIEMPO"}
             </div>
           )}
        </div>
        
        <div className="flex -space-x-2 items-center">
          <div 
            title={`Elaborado por: ${order.createdBy || 'Sistema'}`}
            className="w-6 h-6 rounded-full bg-primary-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
          >
            {(order.createdBy || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400">+</div>
        </div>
      </div>

      {/* Industrial aesthetic details */}
      <div className="absolute bottom-0 right-0 p-1 opacity-5 group-hover:opacity-20 transition-opacity">
        <ShieldAlert className="w-12 h-12 rotate-12" />
      </div>
    </div>
  );
}
