import { ArrowDownRight, ArrowUpRight, AlertTriangle, Eye, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

export function InventoryTable({ items, onEntry, onExit, onViewDetail }) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-medium">No se encontraron refacciones según los filtros.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="p-4">Código</th>
            <th className="p-4">Descripción</th>
            <th className="p-4 text-center">Stock</th>
            <th className="p-4 text-center">Mín / Reorden / Máx</th>
            <th className="p-4 text-center">Activos</th>
            <th className="p-4">Ubicación</th>
            <th className="p-4 text-right">Costo Unit.</th>
            <th className="p-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {items.map((item) => {
            const isLowStock = item.currentStock <= item.minStock;
            const isReorder = item.currentStock <= item.reorderPoint;
            const isCritical = item.currentStock === 0;
            
            const maxVal = item.maxStock || item.minStock * 3 || 1;
            const pct = Math.min((item.currentStock / maxVal) * 100, 100);
            const minPct = (item.minStock / maxVal) * 100;
            const reorderPct = ((item.reorderPoint || 0) / maxVal) * 100;

            return (
              <tr key={item.id} className={cn(
                "hover:bg-gray-50 transition-colors",
                isCritical && "bg-red-50/30",
                !isCritical && isReorder && "bg-orange-50/20"
              )}>
                <td className="p-4">
                  <span className="font-mono text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded">
                    {item.code}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.category} · {item.supplier}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("font-bold text-base", isCritical ? "text-red-600" : isReorder ? "text-orange-600" : "text-gray-900")}>
                        {item.currentStock}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.unit}</span>
                      {isCritical && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      {!isCritical && isReorder && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    {/* Stock bar with markers */}
                    <div className="relative w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                      {/* Min marker */}
                      <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${minPct}%` }} />
                      {/* Reorder marker */}
                      {reorderPct > 0 && (
                        <div className="absolute top-0 bottom-0 w-px bg-orange-400 z-10" style={{ left: `${reorderPct}%` }} />
                      )}
                      {/* Fill */}
                      <div
                        className={cn("h-full rounded-full transition-all duration-500",
                          isCritical ? 'bg-red-500' : isReorder ? 'bg-orange-400' : 'bg-green-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center text-xs text-gray-500 font-mono">
                  <span className="text-red-500">{item.minStock}</span>
                  {' / '}
                  <span className="text-orange-500">{item.reorderPoint || '-'}</span>
                  {' / '}
                  <span className="text-gray-700">{item.maxStock || '-'}</span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                    {item.compatibleAssets && item.compatibleAssets.length > 0 ? (
                      item.compatibleAssets.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-medium">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                    {item.compatibleAssets && item.compatibleAssets.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{item.compatibleAssets.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-gray-600 text-xs font-mono">
                  {item.location || 'N/A'}
                </td>
                <td className="p-4 text-right font-medium">
                  ${item.unitCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onViewDetail && onViewDetail(item)}
                      className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                      title="Ver Detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEntry(item)}
                      className="p-1.5 hover:bg-green-100 text-green-600 rounded-md transition-colors"
                      title="Registrar Entrada"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onExit(item)}
                      className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                      title="Registrar Salida"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
