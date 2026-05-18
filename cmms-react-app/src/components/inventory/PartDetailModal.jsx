import { useState } from 'react';
import { X, Package, AlertTriangle, Settings2, History, Cpu, Save } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { cn } from '../../lib/utils';

export function PartDetailModal({ isOpen, onClose, partId }) {
  const items = useInventoryStore((s) => s.items);
  const movements = useInventoryStore((s) => s.movements);
  const updateStockLevels = useInventoryStore((s) => s.updateStockLevels);

  const part = items.find(p => p.id === partId);

  const [isEditingLevels, setIsEditingLevels] = useState(false);
  const [editLevels, setEditLevels] = useState({ minStock: 0, maxStock: 0, reorderPoint: 0 });

  if (!isOpen || !part) return null;

  const partMovements = movements
    .filter(m => m.partId === partId)
    .slice(0, 8);

  const pct = part.maxStock > 0 ? (part.currentStock / part.maxStock) * 100 : 0;
  const isLow = part.currentStock <= part.reorderPoint;
  const isCritical = part.currentStock === 0;

  const handleEditLevels = () => {
    setEditLevels({ minStock: part.minStock, maxStock: part.maxStock, reorderPoint: part.reorderPoint });
    setIsEditingLevels(true);
  };

  const handleSaveLevels = () => {
    updateStockLevels(part.id, editLevels);
    setIsEditingLevels(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={cn(
          "p-5 border-b flex justify-between items-start text-white",
          isCritical ? "bg-gradient-to-r from-red-600 to-red-700" :
          isLow ? "bg-gradient-to-r from-orange-500 to-amber-600" :
          "bg-gradient-to-r from-primary-600 to-emerald-600"
        )}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm bg-white/20 px-2 py-0.5 rounded">{part.code}</span>
              {isCritical && <span className="text-xs bg-red-800 px-2 py-0.5 rounded-full animate-pulse">⚠ SIN STOCK</span>}
              {!isCritical && isLow && <span className="text-xs bg-orange-800 px-2 py-0.5 rounded-full">⚠ REORDEN</span>}
            </div>
            <h2 className="text-xl font-bold">{part.name}</h2>
            <p className="text-sm opacity-80 mt-0.5">{part.category} · {part.supplier}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stock Visual */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-500" /> Nivel de Stock
              </h3>
              <div className="flex items-center gap-2">
                <span className={cn("text-3xl font-black", isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900')}>
                  {part.currentStock}
                </span>
                <span className="text-sm text-gray-400">{part.unit}</span>
              </div>
            </div>

            {/* Stock bar with markers */}
            <div className="relative">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>0</span>
                <span className="text-red-400 absolute" style={{ left: `${(part.minStock / part.maxStock) * 100}%`, transform: 'translateX(-50%)' }}>Mín: {part.minStock}</span>
                <span className="text-orange-400 absolute" style={{ left: `${(part.reorderPoint / part.maxStock) * 100}%`, transform: 'translateX(-50%)' }}>Reorden: {part.reorderPoint}</span>
                <span>Máx: {part.maxStock}</span>
              </div>
              <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mt-3">
                {/* Zone colors */}
                <div className="absolute inset-0 flex">
                  <div className="bg-red-100 h-full" style={{ width: `${(part.minStock / part.maxStock) * 100}%` }} />
                  <div className="bg-yellow-100 h-full" style={{ width: `${((part.reorderPoint - part.minStock) / part.maxStock) * 100}%` }} />
                  <div className="bg-green-100 h-full flex-1" />
                </div>
                {/* Fill */}
                <div
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-all duration-700 shadow-sm",
                    isCritical ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
                {/* Markers */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${(part.minStock / part.maxStock) * 100}%` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10" style={{ left: `${(part.reorderPoint / part.maxStock) * 100}%` }} />
              </div>
            </div>

            {/* Level Config */}
            <div className="mt-4 flex items-center justify-between">
              {isEditingLevels ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block">Mínimo</label>
                    <input type="number" className="w-full px-2 py-1 text-sm border rounded" value={editLevels.minStock}
                      onChange={(e) => setEditLevels(p => ({ ...p, minStock: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block">Reorden</label>
                    <input type="number" className="w-full px-2 py-1 text-sm border rounded" value={editLevels.reorderPoint}
                      onChange={(e) => setEditLevels(p => ({ ...p, reorderPoint: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block">Máximo</label>
                    <input type="number" className="w-full px-2 py-1 text-sm border rounded" value={editLevels.maxStock}
                      onChange={(e) => setEditLevels(p => ({ ...p, maxStock: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <button onClick={handleSaveLevels} className="mt-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingLevels(false)} className="mt-3 p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Mín: <b className="text-red-600">{part.minStock}</b></span>
                    <span>Reorden: <b className="text-orange-600">{part.reorderPoint}</b></span>
                    <span>Máx: <b className="text-gray-900">{part.maxStock}</b></span>
                  </div>
                  <button onClick={handleEditLevels} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <Settings2 className="w-3.5 h-3.5" /> Configurar Niveles
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="text-xs text-gray-500">Costo Unitario</div>
              <div className="text-lg font-bold text-gray-900">${part.unitCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="text-xs text-gray-500">Valor en Stock</div>
              <div className="text-lg font-bold text-emerald-600">${(part.currentStock * part.unitCost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="text-xs text-gray-500">Ubicación</div>
              <div className="text-sm font-bold font-mono text-gray-900">{part.location || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="text-xs text-gray-500">Proveedor</div>
              <div className="text-sm font-bold text-gray-900">{part.supplier}</div>
            </div>
          </div>

          {/* Compatible Assets */}
          {part.compatibleAssets && part.compatibleAssets.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-primary-500" /> Activos Compatibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {part.compatibleAssets.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-mono font-medium">
                    <Cpu className="w-3.5 h-3.5" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Movements */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-primary-500" /> Últimos Movimientos
            </h3>
            {partMovements.length === 0 ? (
              <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-lg text-center">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-1.5">
                {partMovements.map(mov => (
                  <div key={mov.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        mov.type === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className={cn("font-bold text-xs", mov.type === 'entrada' ? 'text-green-600' : 'text-red-600')}>
                        {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                      </span>
                      <span className="text-gray-600 text-xs">{mov.reason.replace(/_/g, ' ')}</span>
                      {mov.orderId && <span className="font-mono text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{mov.orderId}</span>}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(mov.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      {' · '}{mov.previousStock} → <b className="text-gray-700">{mov.newStock}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
