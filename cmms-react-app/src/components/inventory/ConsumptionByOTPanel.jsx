import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, DollarSign, TrendingUp, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

export function ConsumptionByOTPanel() {
  const items = useInventoryStore((s) => s.items);
  const movements = useInventoryStore((s) => s.movements);
  const [expandedOT, setExpandedOT] = useState(null);

  const consumptionByOrder = useMemo(() => {
    const otMovements = movements.filter(m => m.reason === 'consumo_ot' && m.orderId);
    const orderMap = {};
    otMovements.forEach(mov => {
      if (!orderMap[mov.orderId]) {
        orderMap[mov.orderId] = { orderId: mov.orderId, assetTag: mov.assetTag, items: [], totalCost: 0, totalParts: 0, lastDate: mov.date };
      }
      const part = items.find(p => p.id === mov.partId);
      const cost = (part?.unitCost || 0) * mov.quantity;
      orderMap[mov.orderId].items.push({ ...mov, unitCost: part?.unitCost || 0, totalCost: cost });
      orderMap[mov.orderId].totalCost += cost;
      orderMap[mov.orderId].totalParts += mov.quantity;
      if (new Date(mov.date) > new Date(orderMap[mov.orderId].lastDate)) orderMap[mov.orderId].lastDate = mov.date;
    });
    return Object.values(orderMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
  }, [items, movements]);

  const stats = useMemo(() => {
    const otMovements = movements.filter(m => m.reason === 'consumo_ot');
    const partConsumption = {};
    otMovements.forEach(mov => {
      if (!partConsumption[mov.partId]) {
        const part = items.find(p => p.id === mov.partId);
        partConsumption[mov.partId] = { partId: mov.partId, partCode: mov.partCode, partName: mov.partName, category: part?.category || 'N/A', totalQty: 0, totalCost: 0 };
      }
      const part = items.find(p => p.id === mov.partId);
      partConsumption[mov.partId].totalQty += mov.quantity;
      partConsumption[mov.partId].totalCost += mov.quantity * (part?.unitCost || 0);
    });

    const topConsumed = Object.values(partConsumption).sort((a, b) => b.totalCost - a.totalCost).slice(0, 8);

    const categoryBreakdown = {};
    Object.values(partConsumption).forEach(pc => {
      if (!categoryBreakdown[pc.category]) categoryBreakdown[pc.category] = { category: pc.category, totalCost: 0 };
      categoryBreakdown[pc.category].totalCost += pc.totalCost;
    });

    const totalConsumptionCost = otMovements.reduce((sum, mov) => {
      const part = items.find(p => p.id === mov.partId);
      return sum + (mov.quantity * (part?.unitCost || 0));
    }, 0);

    return {
      topConsumed,
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.totalCost - a.totalCost),
      totalConsumptionCost,
      totalMovements: otMovements.length
    };
  }, [items, movements]);

  const barData = stats.topConsumed.map(item => ({
    name: item.partCode,
    costo: item.totalCost,
    cantidad: item.totalQty,
    fullName: item.partName
  }));

  const pieData = stats.categoryBreakdown.map((cat, idx) => ({
    name: cat.category,
    value: cat.totalCost,
    color: COLORS[idx % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-xl rounded-lg border border-gray-100 p-3 text-sm">
          <p className="font-bold text-gray-900">{data.fullName || data.name}</p>
          <p className="text-primary-600 font-semibold">${payload[0].value?.toLocaleString('es-MX')}</p>
          {data.cantidad && <p className="text-gray-500 text-xs">Cantidad: {data.cantidad} pza</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium mb-1">
            <DollarSign className="w-4 h-4" /> COSTO TOTAL CONSUMIDO
          </div>
          <div className="text-3xl font-black">${stats.totalConsumptionCost.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-violet-200">
          <div className="flex items-center gap-2 text-violet-100 text-xs font-medium mb-1">
            <TrendingUp className="w-4 h-4" /> MOVIMIENTOS DE CONSUMO
          </div>
          <div className="text-3xl font-black">{stats.totalMovements}</div>
        </div>
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-sky-200">
          <div className="flex items-center gap-2 text-sky-100 text-xs font-medium mb-1">
            <FileText className="w-4 h-4" /> OTs CON CONSUMO
          </div>
          <div className="text-3xl font-black">{consumptionByOrder.length}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Consumed Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Top Refacciones Consumidas (por costo)
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="costo" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Sin datos de consumo</div>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-500" />
            Distribución de Costo por Categoría
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-MX')}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Sin datos de consumo</div>
          )}
        </div>
      </div>

      {/* OT Consumption Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" />
            Detalle de Consumo por Orden de Trabajo
          </h3>
        </div>

        {consumptionByOrder.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No hay consumos registrados por OT.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {consumptionByOrder.map((ot) => {
              const isExpanded = expandedOT === ot.orderId;
              return (
                <div key={ot.orderId}>
                  <button
                    onClick={() => setExpandedOT(isExpanded ? null : ot.orderId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 font-mono">{ot.orderId}</span>
                          {ot.assetTag && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{ot.assetTag}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(ot.lastDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}{ot.items.length} refacción(es) · {ot.totalParts} pza total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-gray-900">${ot.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                        <div className="text-xs text-gray-400">costo total</div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 pb-4">
                      <table className="w-full text-sm mt-2">
                        <thead>
                          <tr className="text-xs text-gray-500 border-b border-gray-200">
                            <th className="pb-2 text-left">Refacción</th>
                            <th className="pb-2 text-center">Cant.</th>
                            <th className="pb-2 text-right">Costo Unit.</th>
                            <th className="pb-2 text-right">Subtotal</th>
                            <th className="pb-2 text-left pl-3">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ot.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="py-2">
                                <span className="font-mono text-xs text-primary-600 font-semibold">{item.partCode}</span>
                                <span className="text-gray-500 text-xs ml-2">{item.partName}</span>
                              </td>
                              <td className="py-2 text-center font-bold">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-600">${item.unitCost?.toLocaleString('es-MX')}</td>
                              <td className="py-2 text-right font-bold text-gray-900">${item.totalCost?.toLocaleString('es-MX')}</td>
                              <td className="py-2 pl-3 text-xs text-gray-400 max-w-[200px] truncate">{item.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
