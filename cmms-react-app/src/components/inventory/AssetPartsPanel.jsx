import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Search, Cpu } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAssetsStore } from '../../store/useAssetsStore';
import { cn } from '../../lib/utils';

export function AssetPartsPanel() {
  const items = useInventoryStore((s) => s.items);
  const assets = useAssetsStore((s) => s.assets);
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const assetSummary = useMemo(() => {
    const assetMap = {};
    items.forEach(item => {
      (item.compatibleAssets || []).forEach(tag => {
        if (!assetMap[tag]) assetMap[tag] = { assetTag: tag, parts: [], totalValue: 0, alertCount: 0 };
        assetMap[tag].parts.push(item);
        assetMap[tag].totalValue += item.currentStock * item.unitCost;
        if (item.currentStock <= item.reorderPoint) assetMap[tag].alertCount++;
      });
    });
    return Object.values(assetMap).sort((a, b) => b.alertCount - a.alertCount);
  }, [items]);

  const enrichedSummary = useMemo(() => assetSummary.map(summary => {
    const asset = assets.find(a => a.tag === summary.assetTag);
    return { ...summary, assetName: asset?.name || 'Activo no registrado', area: asset?.area || 'N/A', criticality: asset?.criticality || 'C' };
  }), [assetSummary, assets]);

  const filtered = useMemo(() => enrichedSummary.filter(a =>
    !searchTerm || a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) || a.assetName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [enrichedSummary, searchTerm]);

  const criticalityColors = {
    A: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alta' },
    B: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Media' },
    C: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Baja' },
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar activo por tag o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{filtered.length}</span> activos con refacciones asignadas
        </div>
      </div>

      {/* Asset Cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No se encontraron activos con refacciones asignadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assetData) => {
            const isExpanded = expandedAsset === assetData.assetTag;
            const crit = criticalityColors[assetData.criticality] || criticalityColors.C;

            return (
              <div key={assetData.assetTag} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <button
                  onClick={() => setExpandedAsset(isExpanded ? null : assetData.assetTag)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", assetData.alertCount > 0 ? 'bg-red-100' : 'bg-green-100')}>
                      <Cpu className={cn("w-5 h-5", assetData.alertCount > 0 ? 'text-red-600' : 'text-green-600')} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{assetData.assetTag}</span>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", crit.bg, crit.text)}>
                          Criticidad {crit.label}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate mt-0.5">{assetData.assetName}</p>
                      <p className="text-xs text-gray-400">{assetData.area}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{assetData.parts.length} refacciones</span>
                        {assetData.alertCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {assetData.alertCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Valor: ${assetData.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Parts List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs text-gray-500 font-medium">
                            <th className="p-3 text-left">Código</th>
                            <th className="p-3 text-left">Descripción</th>
                            <th className="p-3 text-center">Stock</th>
                            <th className="p-3 text-center">Mín / Reorden / Máx</th>
                            <th className="p-3 text-center">Estado</th>
                            <th className="p-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {assetData.parts.map(part => {
                            const isLow = part.currentStock <= part.reorderPoint;
                            const isCritical = part.currentStock === 0;
                            const pct = part.maxStock > 0 ? (part.currentStock / part.maxStock) * 100 : 0;

                            return (
                              <tr key={part.id} className={cn("hover:bg-white transition-colors", isCritical && "bg-red-50/50")}>
                                <td className="p-3">
                                  <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{part.code}</span>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">{part.name}</div>
                                  <div className="text-xs text-gray-400">{part.category} · {part.location}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <div className={cn("text-base font-bold", isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900')}>
                                    {part.currentStock}
                                    <span className="text-xs font-normal text-gray-400 ml-0.5">{part.unit}</span>
                                  </div>
                                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto mt-1">
                                    <div
                                      className={cn("h-full rounded-full", isCritical ? 'bg-red-500' : isLow ? 'bg-orange-400' : 'bg-green-500')}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-center text-xs text-gray-500">
                                  {part.minStock} / {part.reorderPoint} / {part.maxStock}
                                </td>
                                <td className="p-3 text-center">
                                  {isCritical ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                                      <AlertTriangle className="w-3 h-3" /> Sin Stock
                                    </span>
                                  ) : isLow ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                      <AlertTriangle className="w-3 h-3" /> Reorden
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">OK</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-medium text-gray-700">
                                  ${(part.currentStock * part.unitCost).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
