import { useMemo } from 'react';
import { useOrdersStore } from '../../store/useOrdersStore';
import { AlertCircle, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function GlobalAlertSystem() {
  const orders = useOrdersStore((state) => state.orders);
  const navigate = useNavigate();

  const urgentOrders = useMemo(() => {
    return orders.filter(o => o.priority === 'P1' && o.status !== 'cerrada');
  }, [orders]);

  if (urgentOrders.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white shadow-2xl animate-in slide-in-from-top duration-500">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between px-4 h-12 md:h-14 overflow-hidden relative">
        {/* Background animation for urgency */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-500 to-red-700 opacity-20 animate-pulse" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">ALERTA CRÍTICA</span>
            <span className="text-xs font-black">{urgentOrders.length}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-sm font-bold truncate max-w-xl">
             <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 shadow-sm" />
             <span className="animate-in fade-in slide-in-from-left-4 duration-1000">
               {urgentOrders[0].title} — <span className="font-mono text-red-100">{urgentOrders[0].assetTag}</span>
             </span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/orders')}
          className="relative z-10 flex items-center gap-2 bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter hover:bg-red-50 transition-colors shadow-lg active:scale-95"
        >
          <span className="hidden md:inline">Atender Urgencias</span>
          <span className="md:hidden">Ver {urgentOrders.length}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
