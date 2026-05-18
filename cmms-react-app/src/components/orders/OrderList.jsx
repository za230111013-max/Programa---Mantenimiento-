import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Wrench, 
  Calendar, 
  Activity 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function OrderList({ orders }) {
  const navigate = useNavigate();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-700 border-red-200';
      case 'P2': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'P3': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'abierta': return 'bg-emerald-100 text-emerald-700';
      case 'asignada': return 'bg-blue-100 text-blue-700';
      case 'en_proceso': return 'bg-purple-100 text-purple-700';
      case 'en_espera': return 'bg-amber-100 text-amber-700';
      case 'cerrada': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'preventivo': return <Calendar className="w-4 h-4" />;
      case 'predictivo': return <Activity className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Equipo</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción de Falla</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento (SLA)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const isOverdue = order.status !== 'cerrada' && new Date(order.dueDate) < new Date();
              
              return (
                <tr 
                  key={order.id} 
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group hover:bg-primary-50/30 transition-all cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 self-start mb-1">
                        {order.assetTag}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">#{order.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1">{order.title}</span>
                      <span className="text-xs text-gray-500 line-clamp-1">{order.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-primary-500 group-hover:bg-white transition-all shadow-sm border border-transparent group-hover:border-primary-100">
                        {getTypeIcon(order.type)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-sm",
                        getPriorityColor(order.priority)
                      )}>
                        {order.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(order.status)
                      )}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Clock className={cn("w-4 h-4", isOverdue ? "text-red-500 animate-pulse" : "text-gray-300")} />
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-bold", isOverdue ? "text-red-600" : "text-gray-700")}>
                          {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-0.5 mt-0.5">
                            <AlertCircle className="w-2 h-2" /> Vencida
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {orders.length === 0 && (
        <div className="p-12 text-center text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium italic">No se encontraron órdenes de trabajo en esta vista.</p>
        </div>
      )}
    </div>
  );
}
