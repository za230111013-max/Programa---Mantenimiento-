import { useState, useMemo } from 'react';
import { Package, FolderOpen, AlertTriangle, DollarSign, Plus, History, Bell, Cpu, BarChart3, Search } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { PartModal } from '../../components/inventory/PartModal';
import { MovementModal } from '../../components/inventory/MovementModal';
import { MovementHistoryModal } from '../../components/inventory/MovementHistoryModal';
import { PartDetailModal } from '../../components/inventory/PartDetailModal';
import { ReorderAlertsPanel } from '../../components/inventory/ReorderAlertsPanel';
import { AssetPartsPanel } from '../../components/inventory/AssetPartsPanel';
import { ConsumptionByOTPanel } from '../../components/inventory/ConsumptionByOTPanel';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'catalog', label: 'Catálogo', icon: Package },
  { id: 'reorder', label: 'Alertas Reorden', icon: Bell },
  { id: 'assets', label: 'Activos y Partes', icon: Cpu },
  { id: 'consumption', label: 'Consumo por OT', icon: BarChart3 },
];

export function InventoryPage() {
  const items = useInventoryStore((s) => s.items);
  const movements = useInventoryStore((s) => s.movements);

  const [activeTab, setActiveTab] = useState('catalog');
  const [filterCat, setFilterCat] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [partModalState, setPartModalState] = useState({ isOpen: false, editPart: null });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [movementModalState, setMovementModalState] = useState({ isOpen: false, part: null, type: null });
  const [detailPartId, setDetailPartId] = useState(null);

  // Derived data (memoized to avoid infinite loops)
  const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);
  const lowStockItems = useMemo(() => items.filter(item => item.currentStock <= item.minStock), [items]);
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0), [items]);

  const reorderAlerts = useMemo(() => {
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

  const consumptionStats = useMemo(() => {
    const otMovements = movements.filter(m => m.reason === 'consumo_ot');
    const totalConsumptionCost = otMovements.reduce((sum, mov) => {
      const part = items.find(p => p.id === mov.partId);
      return sum + (mov.quantity * (part?.unitCost || 0));
    }, 0);
    const orderIds = new Set(otMovements.filter(m => m.orderId).map(m => m.orderId));
    const partIds = new Set(otMovements.map(m => m.partId));
    return { totalConsumptionCost, totalMovements: otMovements.length, uniqueOrders: orderIds.size, uniqueParts: partIds.size };
  }, [items, movements]);

  // Filtering (for catalog tab)
  const filteredItems = useMemo(() => items.filter(item => {
    if (filterCat && item.category !== filterCat) return false;
    if (filterStock === 'low' && item.currentStock > item.minStock) return false;
    if (filterStock === 'reorder' && item.currentStock > item.reorderPoint) return false;
    if (filterStock === 'ok' && item.currentStock <= item.minStock) return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(lowerSearch) || item.code.toLowerCase().includes(lowerSearch) || item.supplier?.toLowerCase().includes(lowerSearch);
    }
    return true;
  }), [items, filterCat, filterStock, searchTerm]);

  const handleEntry = (part) => setMovementModalState({ isOpen: true, part, type: 'entrada' });
  const handleExit = (part) => setMovementModalState({ isOpen: true, part, type: 'salida' });
  const handleViewDetail = (part) => setDetailPartId(part.id);

  // Tab-specific KPIs
  const kpis = useMemo(() => {
    switch (activeTab) {
      case 'catalog':
        return [
          { name: 'Total Repuestos', value: items.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
          { name: 'Categorías', value: categories.length, icon: FolderOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
          { name: 'Stock Bajo', value: lowStockItems.length, icon: AlertTriangle, color: lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600', bg: lowStockItems.length > 0 ? 'bg-red-100' : 'bg-green-100' },
          { name: 'Valor Total', value: `$${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ];
      case 'reorder':
        return [
          { name: 'Alertas Activas', value: reorderAlerts.length, icon: Bell, color: reorderAlerts.length > 0 ? 'text-red-600' : 'text-green-600', bg: reorderAlerts.length > 0 ? 'bg-red-100' : 'bg-green-100' },
          { name: 'Ítems Críticos', value: reorderAlerts.filter(a => a.severity === 'critical').length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
          { name: 'Inversión Reorden', value: `$${reorderAlerts.reduce((s, a) => s + a.estimatedCost, 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
          { name: 'Categorías Afectadas', value: new Set(reorderAlerts.map(a => a.category)).size, icon: FolderOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
        ];
      case 'assets':
        return [
          { name: 'Activos con Partes', value: assetSummary.length, icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-100' },
          { name: 'Activos en Riesgo', value: assetSummary.filter(a => a.alertCount > 0).length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
          { name: 'Total Repuestos', value: items.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
          { name: 'Valor Asignado', value: `$${assetSummary.reduce((s, a) => s + a.totalValue, 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ];
      case 'consumption':
        return [
          { name: 'Costo Consumido', value: `$${consumptionStats.totalConsumptionCost.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { name: 'Movimientos OT', value: consumptionStats.totalMovements, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
          { name: 'OTs con Consumo', value: consumptionStats.uniqueOrders, icon: Package, color: 'text-violet-600', bg: 'bg-violet-100' },
          { name: 'Refacciones Usadas', value: consumptionStats.uniqueParts, icon: FolderOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
        ];
      default:
        return [];
    }
  }, [activeTab, items, categories, lowStockItems, totalValue, reorderAlerts, assetSummary, consumptionStats]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Refacciones</h1>
          <p className="text-gray-500 text-sm mt-1">Control de stock, alertas de reorden, activos y consumo por OT.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <History className="w-4 h-4 mr-2" />
            Movimientos
          </button>
          <button 
            onClick={() => setPartModalState({ isOpen: true, editPart: null })}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-2 pt-2 gap-1" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
                    isActive
                      ? "bg-white text-primary-700 border border-gray-200 border-b-white -mb-px shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'reorder' && reorderAlerts.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {reorderAlerts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <div>
              <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Package className="w-4 h-4 text-primary-500" />
                  Catálogo de Repuestos
                  <span className="text-xs font-normal text-gray-400 ml-1">({filteredItems.length} de {items.length})</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar código, nombre o proveedor..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm sm:w-72 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={filterStock}
                    onChange={(e) => setFilterStock(e.target.value)}
                  >
                    <option value="">Todo el Stock</option>
                    <option value="reorder">En Punto de Reorden</option>
                    <option value="low">Stock Bajo (≤ Mínimo)</option>
                    <option value="ok">Stock Sano (OK)</option>
                  </select>
                </div>
              </div>
              
              <InventoryTable 
                items={filteredItems} 
                onEntry={handleEntry}
                onExit={handleExit}
                onViewDetail={handleViewDetail}
              />
            </div>
          )}

          {/* Reorder Alerts Tab */}
          {activeTab === 'reorder' && (
            <div className="p-5">
              <ReorderAlertsPanel />
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="p-5">
              <AssetPartsPanel />
            </div>
          )}

          {/* Consumption Tab */}
          {activeTab === 'consumption' && (
            <div className="p-5">
              <ConsumptionByOTPanel />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PartModal 
        isOpen={partModalState.isOpen} 
        onClose={() => setPartModalState({ isOpen: false, editPart: null })} 
        editPart={partModalState.editPart}
      />
      <MovementHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />
      <MovementModal 
        isOpen={movementModalState.isOpen} 
        onClose={() => setMovementModalState({ isOpen: false, part: null, type: null })}
        part={movementModalState.part}
        type={movementModalState.type}
      />
      <PartDetailModal
        isOpen={!!detailPartId}
        onClose={() => setDetailPartId(null)}
        partId={detailPartId}
      />
    </div>
  );
}
