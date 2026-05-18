import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';
import {
  Activity, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown,
  Wrench, Gauge, Timer, BarChart3, Shield, Zap, Cpu, Package
} from 'lucide-react';
import { useOrdersStore } from '../store/useOrdersStore';
import { useAssetsStore } from '../store/useAssetsStore';
import { usePreventiveStore } from '../store/usePreventiveStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { usePredictiveStore } from '../store/usePredictiveStore';
import { cn } from '../lib/utils';

// ─── Color palette ──────────────────────────────────────────────────────
const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── KPI Card Component ─────────────────────────────────────────────────
function KPICard({ title, value, unit, icon: Icon, color, bgGradient, subtitle, target, trend }) {
  const isGood = trend === 'good';
  const isBad = trend === 'bad';

  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-5 shadow-lg border border-white/10 text-white", bgGradient)}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
          <Icon className="w-4 h-4" />
          {title}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black">{value}</span>
          {unit && <span className="text-sm font-medium text-white/60">{unit}</span>}
        </div>
        {target && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", isGood ? 'bg-green-300' : isBad ? 'bg-red-300' : 'bg-yellow-300')}
                style={{ width: `${Math.min(100, (parseFloat(value) / parseFloat(target)) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-white/50">Meta: {target}{unit}</span>
          </div>
        )}
        {subtitle && <p className="text-xs text-white/50 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard Component ────────────────────────────────────────────────
export function Dashboard() {
  const orders = useOrdersStore((s) => s.orders);
  const assets = useAssetsStore((s) => s.assets);
  const plans = usePreventiveStore((s) => s.plans);
  const inventoryItems = useInventoryStore((s) => s.items);
  const predictiveReadings = usePredictiveStore((s) => s.readings);

  // ═══════════════════════════════════════════════════════════════════════
  // KPI CALCULATIONS (all derived from OTs)
  // ═══════════════════════════════════════════════════════════════════════

  const kpiData = useMemo(() => {
    const now = new Date();
    const closedOrders = orders.filter(o => o.status === 'cerrada' && o.closedAt);
    const activeOrders = orders.filter(o => o.status !== 'cerrada');
    const correctiveOrders = orders.filter(o => o.type === 'correctivo' || o.type === 'emergencia');
    const preventiveOrders = orders.filter(o => o.type === 'preventivo');
    const closedCorrective = closedOrders.filter(o => o.type === 'correctivo' || o.type === 'emergencia');
    const closedPreventive = closedOrders.filter(o => o.type === 'preventivo');

    // ── MTTR (Mean Time To Repair) ──────────────────────
    // Average repair hours of closed corrective/emergency orders
    const repairHours = closedCorrective.filter(o => o.repairHours).map(o => o.repairHours);
    const mttr = repairHours.length > 0
      ? repairHours.reduce((a, b) => a + b, 0) / repairHours.length
      : 0;

    // ── MTBF (Mean Time Between Failures) ───────────────
    // For each asset, calculate average days between corrective OTs
    const assetFailures = {};
    closedCorrective.forEach(o => {
      if (!assetFailures[o.assetTag]) assetFailures[o.assetTag] = [];
      assetFailures[o.assetTag].push(new Date(o.createdAt));
    });

    let totalTBF = 0;
    let tbfCount = 0;
    Object.values(assetFailures).forEach(dates => {
      const sorted = dates.sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const daysBetween = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60);
        totalTBF += daysBetween;
        tbfCount++;
      }
    });
    const mtbf = tbfCount > 0 ? totalTBF / tbfCount : 720; // default ~30 days

    // ── Availability ────────────────────────────────────
    // A = MTBF / (MTBF + MTTR) * 100
    const availability = mtbf > 0 ? (mtbf / (mtbf + mttr)) * 100 : 95;

    // ── OEE (Overall Equipment Effectiveness) ───────────
    // Simplified: Availability × Performance × Quality
    // Performance = planned vs actual production (simulated ~92%)
    // Quality = good parts / total parts (simulated ~98%)
    const performance = 92;
    const quality = 98;
    const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

    // ── % Correctivo ────────────────────────────────────
    const totalOrders = orders.length;
    const correctivePercent = totalOrders > 0
      ? ((correctiveOrders.length / totalOrders) * 100)
      : 0;

    // ── % Cumplimiento PM ───────────────────────────────
    const totalPM = preventiveOrders.length;
    const completedPM = closedPreventive.length;
    const pmCompliance = totalPM > 0 ? (completedPM / totalPM) * 100 : 100;

    // ── Backlog ─────────────────────────────────────────
    // Active orders × avg repair time / available hours per week (40h)
    const avgRepair = mttr || 3;
    const backlogHours = activeOrders.length * avgRepair;
    const backlogWeeks = backlogHours / 40;

    return {
      mttr: mttr.toFixed(1),
      mtbf: (mtbf / 24).toFixed(0), // convert hours to days for display
      mtbfHours: mtbf.toFixed(0),
      availability: availability.toFixed(1),
      oee: oee.toFixed(1),
      correctivePercent: correctivePercent.toFixed(0),
      pmCompliance: pmCompliance.toFixed(0),
      backlogWeeks: backlogWeeks.toFixed(1),
      backlogHours: backlogHours.toFixed(0),
      activeOrders: activeOrders.length,
      closedOrders: closedOrders.length,
      totalOrders: totalOrders,
      performance,
      quality
    };
  }, [orders]);

  // ═══════════════════════════════════════════════════════════════════════
  // CHARTS DATA
  // ═══════════════════════════════════════════════════════════════════════

  // ── Pareto de Fallas ──────────────────────────────────
  const paretoData = useMemo(() => {
    const causeCounts = {};
    orders.filter(o => o.failureCause).forEach(o => {
      causeCounts[o.failureCause] = (causeCounts[o.failureCause] || 0) + 1;
    });
    const sorted = Object.entries(causeCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((s, c) => s + c.count, 0);
    let cumulative = 0;
    return sorted.map(item => {
      cumulative += item.count;
      return { ...item, cumulativePercent: Math.round((cumulative / total) * 100) };
    });
  }, [orders]);

  // ── Tendencias Mensuales ──────────────────────────────
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = orders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= d && created <= monthEnd;
      });
      const closed = monthOrders.filter(o => o.status === 'cerrada');
      const corrective = monthOrders.filter(o => o.type === 'correctivo' || o.type === 'emergencia');
      const preventive = monthOrders.filter(o => o.type === 'preventivo');
      const repairH = closed.filter(o => o.repairHours).map(o => o.repairHours);
      const avgMTTR = repairH.length > 0 ? repairH.reduce((a, b) => a + b, 0) / repairH.length : 0;

      months.push({
        month: MONTH_NAMES[d.getMonth()],
        total: monthOrders.length,
        correctivo: corrective.length,
        preventivo: preventive.length,
        mttr: parseFloat(avgMTTR.toFixed(1)),
        cumplimiento: preventive.length > 0 ? Math.round((preventive.filter(o => o.status === 'cerrada').length / preventive.length) * 100) : 100
      });
    }
    return months;
  }, [orders]);

  // ── Top Activos Críticos ──────────────────────────────
  const topAssets = useMemo(() => {
    const assetData = {};
    orders.forEach(o => {
      if (!assetData[o.assetTag]) {
        const asset = assets.find(a => a.tag === o.assetTag);
        assetData[o.assetTag] = { tag: o.assetTag, name: asset?.name || o.assetTag, area: asset?.area || o.area || 'N/A', criticality: asset?.criticality || 'C', totalOTs: 0, correctiveOTs: 0, totalRepairH: 0, failureCauses: {} };
      }
      assetData[o.assetTag].totalOTs++;
      if (o.type === 'correctivo' || o.type === 'emergencia') {
        assetData[o.assetTag].correctiveOTs++;
      }
      if (o.repairHours) assetData[o.assetTag].totalRepairH += o.repairHours;
      if (o.failureCause) {
        assetData[o.assetTag].failureCauses[o.failureCause] = (assetData[o.assetTag].failureCauses[o.failureCause] || 0) + 1;
      }
    });

    return Object.values(assetData)
      .map(a => {
        const liveAsset = assets.find(la => la.tag === a.tag);
        return { 
          ...a, 
          topCause: Object.entries(a.failureCauses).sort((x, y) => y[1] - x[1])[0]?.[0] || 'N/A',
          healthScore: liveAsset?.healthScore || 100,
          reliability: liveAsset ? useAssetsStore.getState().getAssetReliability(liveAsset.id) : 100
        };
      })
      .sort((a, b) => b.correctiveOTs - a.correctiveOTs);
  }, [orders, assets]);

  // ── Distribution by Type ──────────────────────────────
  const typeDistribution = useMemo(() => {
    const types = { correctivo: 0, preventivo: 0, emergencia: 0 };
    orders.forEach(o => { if (types[o.type] !== undefined) types[o.type]++; });
    return [
      { name: 'Correctivo', value: types.correctivo, color: '#dc2626' },
      { name: 'Preventivo', value: types.preventivo, color: '#16a34a' },
      { name: 'Emergencia', value: types.emergencia, color: '#d97706' },
    ];
  }, [orders]);

  // ── Inventory & Predictive Quick Stats ────────────────
  const quickStats = useMemo(() => {
    const lowStock = inventoryItems.filter(i => i.currentStock <= i.reorderPoint).length;
    const inventoryValue = inventoryItems.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
    return { lowStock, inventoryValue };
  }, [inventoryItems]);

  // ── Custom Tooltip ────────────────────────────────────
  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white shadow-xl rounded-lg border border-gray-100 p-3 text-sm">
          <p className="font-bold text-gray-900 mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="font-medium">
              {p.name}: {p.value}{p.name === 'mttr' ? 'h' : p.name === 'cumplimiento' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-500 text-sm mt-1">KPIs de mantenimiento calculados desde {kpiData.totalOrders} órdenes de trabajo.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Datos en tiempo real · {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ═══ KPI Grid (7 mandatory KPIs) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="MTBF" value={kpiData.mtbf} unit="días"
          icon={Timer} bgGradient="bg-gradient-to-br from-blue-600 to-blue-800"
          subtitle={`${kpiData.mtbfHours}h entre fallas`}
          trend="good"
        />
        <KPICard
          title="MTTR" value={kpiData.mttr} unit="horas"
          icon={Wrench} bgGradient="bg-gradient-to-br from-amber-500 to-orange-700"
          subtitle="Tiempo promedio de reparación"
          target="4" trend={parseFloat(kpiData.mttr) <= 4 ? 'good' : 'bad'}
        />
        <KPICard
          title="Disponibilidad" value={kpiData.availability} unit="%"
          icon={Gauge} bgGradient="bg-gradient-to-br from-emerald-500 to-green-700"
          subtitle="MTBF / (MTBF + MTTR)"
          target="95" trend={parseFloat(kpiData.availability) >= 95 ? 'good' : 'bad'}
        />
        <KPICard
          title="OEE" value={kpiData.oee} unit="%"
          icon={TrendingUp} bgGradient="bg-gradient-to-br from-violet-500 to-purple-800"
          subtitle={`Disp ${kpiData.availability}% × Rend ${kpiData.performance}% × Cal ${kpiData.quality}%`}
          target="85" trend={parseFloat(kpiData.oee) >= 85 ? 'good' : 'bad'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="% Correctivo" value={kpiData.correctivePercent} unit="%"
          icon={AlertTriangle}
          bgGradient={parseFloat(kpiData.correctivePercent) <= 30 ? "bg-gradient-to-br from-green-600 to-emerald-800" : "bg-gradient-to-br from-red-500 to-rose-700"}
          subtitle={parseFloat(kpiData.correctivePercent) <= 30 ? '✓ Dentro de meta (<30%)' : '⚠ Fuera de meta (>30%)'}
          target="30" trend={parseFloat(kpiData.correctivePercent) <= 30 ? 'good' : 'bad'}
        />
        <KPICard
          title="Cumplimiento PM" value={kpiData.pmCompliance} unit="%"
          icon={CheckCircle}
          bgGradient={parseFloat(kpiData.pmCompliance) >= 90 ? "bg-gradient-to-br from-green-600 to-emerald-800" : "bg-gradient-to-br from-red-500 to-rose-700"}
          subtitle={parseFloat(kpiData.pmCompliance) >= 90 ? '✓ Dentro de meta (>90%)' : '⚠ Fuera de meta (<90%)'}
          target="90" trend={parseFloat(kpiData.pmCompliance) >= 90 ? 'good' : 'bad'}
        />
        <KPICard
          title="Backlog" value={kpiData.backlogWeeks} unit="semanas"
          icon={Clock}
          bgGradient={parseFloat(kpiData.backlogWeeks) <= 4 ? "bg-gradient-to-br from-sky-500 to-blue-700" : "bg-gradient-to-br from-red-500 to-rose-700"}
          subtitle={`${kpiData.backlogHours}h de trabajo pendiente · ${kpiData.activeOrders} OTs activas`}
          trend={parseFloat(kpiData.backlogWeeks) <= 4 ? 'good' : 'bad'}
        />
      </div>

      {/* ═══ Charts Row 1: Pareto + Distribution ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto de Fallas */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            Pareto de Fallas
            <span className="text-xs text-gray-400 font-normal ml-2">(Causas de correctivos/emergencias)</span>
          </h3>
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paretoData} margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cause" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="left" dataKey="count" name="Frecuencia" radius={[6, 6, 0, 0]}>
                  {paretoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="% Acumulado" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: '#dc2626', r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Sin datos de fallas</div>
          )}
        </div>

        {/* Type Distribution Donut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            Distribución por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {typeDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="white" strokeWidth={3} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} OTs`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {typeDistribution.map(t => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-gray-600">{t.name}: <b>{t.value}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Charts Row 2: Monthly Trends ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OT Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Tendencia Mensual de OTs
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrends} margin={{ left: 0, right: 10 }}>
              <defs>
                <linearGradient id="colorCorr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="correctivo" name="Correctivo" stroke="#dc2626" fill="url(#colorCorr)" strokeWidth={2.5} dot={{ r: 4, fill: '#dc2626' }} />
              <Area type="monotone" dataKey="preventivo" name="Preventivo" stroke="#16a34a" fill="url(#colorPrev)" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* MTTR & Compliance Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary-500" />
            MTTR y Cumplimiento PM (Mensual)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrends} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Horas', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip content={<ChartTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="mttr" name="MTTR" stroke="#d97706" strokeWidth={2.5} dot={{ r: 5, fill: '#d97706' }} />
              <Line yAxisId="right" type="monotone" dataKey="cumplimiento" name="Cumplimiento PM" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 5, fill: '#16a34a' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Top Activos Críticos ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-500" />
            Top Activos Críticos
            <span className="text-xs text-gray-400 font-normal ml-2">(Ordenados por OTs correctivas)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 text-left">Activo</th>
                <th className="p-4 text-center">Total OTs</th>
                <th className="p-4 text-center">Correctivas</th>
                <th className="p-4 text-center">Salud</th>
                <th className="p-4 text-center">Confiabilidad</th>
                <th className="p-4 text-left">Causa Principal</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topAssets.map(asset => {
                const corrPct = asset.totalOTs > 0 ? Math.round((asset.correctiveOTs / asset.totalOTs) * 100) : 0;
                const critColors = { A: 'text-red-700 bg-red-100', B: 'text-amber-700 bg-amber-100', C: 'text-blue-700 bg-blue-100' };

                return (
                  <tr key={asset.tag} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", asset.correctiveOTs > 5 ? 'bg-red-100' : 'bg-green-100')}>
                          <Cpu className={cn("w-5 h-5", asset.correctiveOTs > 5 ? 'text-red-600' : 'text-green-600')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{asset.tag}</span>
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", critColors[asset.criticality] || critColors.C)}>
                              {asset.criticality}
                            </span>
                          </div>
                          <p className="text-gray-700 text-xs mt-0.5">{asset.name}</p>
                          <p className="text-gray-400 text-[10px]">{asset.area}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-bold text-gray-900">{asset.totalOTs}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("text-lg font-bold", asset.correctiveOTs > 5 ? 'text-red-600' : 'text-gray-900')}>{asset.correctiveOTs}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn("text-sm font-bold", asset.healthScore < 60 ? 'text-red-600' : asset.healthScore < 80 ? 'text-amber-600' : 'text-green-600')}>
                          {asset.healthScore}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div className={cn("h-full rounded-full", asset.healthScore < 60 ? 'bg-red-500' : asset.healthScore < 80 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${asset.healthScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("text-sm font-bold", parseFloat(asset.reliability) < 70 ? 'text-red-600' : 'text-gray-900')}>
                        {asset.reliability}%
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{asset.topCause}</span>
                    </td>
                    <td className="p-4 text-center">
                      {asset.correctiveOTs > 5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" /> Crítico
                        </span>
                      ) : asset.correctiveOTs > 3 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" /> Atención
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Quick Stats Row (Inventory + Predictive) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4"><Wrench className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">OTs Activas</p>
            <p className="text-xl font-bold text-gray-900">{kpiData.activeOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">OTs Cerradas</p>
            <p className="text-xl font-bold text-gray-900">{kpiData.closedOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center hover:shadow-md transition-shadow">
          <div className={cn("p-3 rounded-lg mr-4", quickStats.lowStock > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}><Package className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Repuestos en Reorden</p>
            <p className="text-xl font-bold text-gray-900">{quickStats.lowStock}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 mr-4"><Shield className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Valor Inventario</p>
            <p className="text-xl font-bold text-gray-900">${(quickStats.inventoryValue / 1000).toFixed(0)}k</p>
          </div>
        </div>
      </div>
    </div>
  );
}
