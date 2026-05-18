import { useMemo } from 'react';
import { AlertTriangle, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { cn } from '../../lib/utils';

const severityConfig = {
  critical: { label: 'Crítico', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700', icon: '🔴', pulse: true },
  urgent:   { label: 'Urgente', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700', icon: '🟠', pulse: false },
  low:      { label: 'Bajo', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700', icon: '🟡', pulse: false },
};

export function ReorderAlertsPanel() {
  const items = useInventoryStore((s) => s.items);

  const alerts = useMemo(() => {
    return items
      .filter(item => item.currentStock <= item.reorderPoint)
      .map(item => {
        let severity = 'low';
        if (item.currentStock === 0) severity = 'critical';
        else if (item.currentStock <= Math.floor(item.reorderPoint * 0.5)) severity = 'urgent';

        const qtyToReorder = item.maxStock - item.currentStock;
        const estimatedCost = qtyToReorder * item.unitCost;
        return { ...item, severity, qtyToReorder, estimatedCost };
      })
      .sort((a, b) => {
        const order = { critical: 0, urgent: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      });
  }, [items]);

  const totalEstimatedCost = alerts.reduce((sum, a) => sum + a.estimatedCost, 0);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">¡Inventario Sano!</h3>
        <p className="text-sm text-gray-500 max-w-xs">Todos los repuestos están por encima de su punto de reorden. No se requieren acciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-red-200">
          <div className="flex items-center gap-2 text-red-100 text-xs font-medium mb-1">
            <AlertTriangle className="w-4 h-4" /> ALERTAS ACTIVAS
          </div>
          <div className="text-3xl font-black">{alerts.length}</div>
          <div className="text-xs text-red-200 mt-1">{criticalCount} críticos · {urgentCount} urgentes</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center gap-2 text-amber-100 text-xs font-medium mb-1">
            <ShoppingCart className="w-4 h-4" /> PIEZAS A PEDIR
          </div>
          <div className="text-3xl font-black">{alerts.reduce((sum, a) => sum + a.qtyToReorder, 0)}</div>
          <div className="text-xs text-amber-200 mt-1">para alcanzar stock máximo</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-1">
            <DollarSign className="w-4 h-4" /> INVERSIÓN ESTIMADA
          </div>
          <div className="text-3xl font-black">${totalEstimatedCost.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
          <div className="text-xs text-blue-200 mt-1">costo de reabastecimiento</div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts.map((item) => {
          const config = severityConfig[item.severity];
          const pct = item.maxStock > 0 ? (item.currentStock / item.maxStock) * 100 : 0;

          return (
            <div key={item.id} className={cn("rounded-xl border-2 p-4 transition-all hover:shadow-md", config.bg, config.border)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white", config.badge, config.pulse && "animate-pulse")}>
                      {config.icon} {config.label}
                    </span>
                    <span className="font-mono text-xs text-gray-500 bg-white px-2 py-0.5 rounded">{item.code}</span>
                  </div>
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.supplier} · {item.location}</p>

                  {/* Stock bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                        <span>0</span>
                        <span className="text-red-400">Mín: {item.minStock}</span>
                        <span className="text-orange-400">Reorden: {item.reorderPoint}</span>
                        <span>Máx: {item.maxStock}</span>
                      </div>
                      <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${(item.minStock / item.maxStock) * 100}%` }} />
                        <div className="absolute top-0 bottom-0 w-px bg-orange-400 z-10" style={{ left: `${(item.reorderPoint / item.maxStock) * 100}%` }} />
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", item.currentStock === 0 ? 'bg-red-500' : item.severity === 'urgent' ? 'bg-orange-400' : 'bg-yellow-400')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className={cn("text-right font-bold text-lg min-w-[3rem]", config.text)}>
                      {item.currentStock}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">{item.unit}</span>
                    </div>
                  </div>

                  {/* Compatible Assets */}
                  {item.compatibleAssets?.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-gray-400 mr-1">Activos:</span>
                      {item.compatibleAssets.map(tag => (
                        <span key={tag} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400 mb-1">Pedir</div>
                  <div className="text-2xl font-black text-gray-900">{item.qtyToReorder}</div>
                  <div className="text-xs text-gray-500">{item.unit}</div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">${item.estimatedCost.toLocaleString('es-MX')}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
