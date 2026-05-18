/**
 * CMMS Enterprise — Módulo Dashboard
 * KPIs principales, gráficos de tendencia y alertas
 */

const DashboardModule = (() => {

  async function render() {
    const [assets, workorders, inventory, plans] = await Promise.all([
      CMMSDatabase.getAll('assets'),
      CMMSDatabase.getAll('workorders'),
      CMMSDatabase.getAll('inventory'),
      CMMSDatabase.getAll('preventive_plans')
    ]);

    const kpis = calculateKPIs(assets, workorders, plans);
    const alerts = generateAlerts(assets, workorders, inventory, plans);

    const html = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de Mantenimiento</h1>
          <p class="page-subtitle">Resumen operativo en tiempo real — Planta Manufactura Automotriz</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="DashboardModule.refresh()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            Actualizar
          </button>
          <button class="btn btn-primary" onclick="Router.navigate('/workorders/new')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva OT
          </button>
        </div>
      </div>

      <!-- KPIs Principales -->
      <div class="kpi-grid" id="kpi-grid">
        ${Components.KPICard({
          id: 'kpi-oee', title: 'OEE', value: kpis.oee.toFixed(1), unit: '%',
          icon: '⚡', color: kpis.oee >= 85 ? 'var(--success)' : kpis.oee >= 65 ? 'var(--warning)' : 'var(--danger)',
          trend: kpis.oee >= 80 ? 'up' : 'down', trendValue: '+2.3%',
          subtitle: 'Overall Equipment Effectiveness'
        })}
        ${Components.KPICard({
          id: 'kpi-availability', title: 'Disponibilidad', value: kpis.availability.toFixed(1), unit: '%',
          icon: '🏭', color: kpis.availability >= 95 ? 'var(--success)' : kpis.availability >= 85 ? 'var(--warning)' : 'var(--danger)',
          trend: 'up', trendValue: '+1.5%',
          subtitle: 'Meta: >95%'
        })}
        ${Components.KPICard({
          id: 'kpi-mtbf', title: 'MTBF', value: kpis.mtbf.toFixed(0), unit: 'hrs',
          icon: '🔧', color: 'var(--info)',
          trend: kpis.mtbf > 200 ? 'up' : 'down', trendValue: kpis.mtbf > 200 ? '+15h' : '-8h',
          subtitle: 'Tiempo medio entre fallas'
        })}
        ${Components.KPICard({
          id: 'kpi-mttr', title: 'MTTR', value: kpis.mttr.toFixed(1), unit: 'hrs',
          icon: '⏱️', color: kpis.mttr <= 4 ? 'var(--success)' : 'var(--warning)',
          trend: kpis.mttr <= 4 ? 'up' : 'down', trendValue: kpis.mttr <= 4 ? '-0.5h' : '+0.3h',
          subtitle: 'Tiempo medio de reparación'
        })}
        ${Components.KPICard({
          id: 'kpi-backlog', title: 'Backlog', value: kpis.backlog, unit: 'OTs',
          icon: '📋', color: kpis.backlog <= 10 ? 'var(--success)' : kpis.backlog <= 25 ? 'var(--warning)' : 'var(--danger)',
          trend: kpis.backlog <= 15 ? 'up' : 'down', trendValue: `${kpis.backlogWeeks.toFixed(1)} sem`,
          subtitle: 'Órdenes pendientes'
        })}
        ${Components.KPICard({
          id: 'kpi-compliance', title: 'Cumplimiento PM', value: kpis.pmCompliance.toFixed(0), unit: '%',
          icon: '✅', color: kpis.pmCompliance >= 90 ? 'var(--success)' : kpis.pmCompliance >= 75 ? 'var(--warning)' : 'var(--danger)',
          trend: kpis.pmCompliance >= 85 ? 'up' : 'down', trendValue: '+3%',
          subtitle: 'Plan preventivo'
        })}
      </div>

      <!-- Gráficos -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Tendencia de Fallas (Últimos 6 Meses)</h3>
          </div>
          <div class="card-body">
            <div class="chart-container"><canvas id="chart-failures-trend"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Distribución de OT por Tipo</h3>
          </div>
          <div class="card-body">
            <div class="chart-container"><canvas id="chart-wo-distribution"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Top 10 Equipos con Más Fallas</h3>
          </div>
          <div class="card-body">
            <div class="chart-container"><canvas id="chart-top-failures"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Costo de Mantenimiento por Área</h3>
          </div>
          <div class="card-body">
            <div class="chart-container"><canvas id="chart-cost-area"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Fila inferior: Alertas + OTs Recientes -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⚠️ Alertas y Notificaciones</h3>
            <span class="badge badge-danger">${alerts.length}</span>
          </div>
          <div class="card-body card-body-np" style="padding: 0 var(--space-3) var(--space-3); max-height: 380px; overflow-y: auto;">
            <div class="alert-list" id="alerts-list">
              ${alerts.map(a => `
                <div class="alert-item alert-item-${a.severity}">
                  <span class="alert-item-icon">${a.icon}</span>
                  <div class="alert-item-content">
                    <div class="alert-item-title">${a.title}</div>
                    <div class="alert-item-desc">${a.description}</div>
                  </div>
                  <span class="alert-item-time">${a.time}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📝 Órdenes de Trabajo Recientes</h3>
            <a href="#/workorders" class="btn btn-sm btn-ghost">Ver todas</a>
          </div>
          <div class="card-body card-body-np" style="padding: 0; max-height: 380px; overflow-y: auto;">
            <table class="datatable">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${getRecentWorkOrders(workorders).map(wo => `
                  <tr style="cursor:pointer" onclick="Router.navigate('/workorders/${wo.id}')">
                    <td><strong>${wo.folio}</strong></td>
                    <td class="truncate" style="max-width:150px" title="${wo.assetName}">${wo.assetTag}</td>
                    <td>${Components.StatusBadge(wo.type)}</td>
                    <td>${Components.StatusBadge(wo.priority)}</td>
                    <td>${Components.StatusBadge(wo.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Fila de estado rápido -->
      <div class="charts-grid mt-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Estado de Equipos por Área</h3>
          </div>
          <div class="card-body">
            <div class="chart-container-sm" style="height:250px"><canvas id="chart-asset-status"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ratio Correctivo vs Preventivo</h3>
          </div>
          <div class="card-body">
            <div class="chart-container-sm" style="height:250px"><canvas id="chart-ratio"></canvas></div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  function calculateKPIs(assets, workorders, plans) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Filtrar OTs del último mes
    const recentWOs = workorders.filter(wo => new Date(wo.createdAt) >= thirtyDaysAgo);
    const correctiveWOs = workorders.filter(wo => wo.type === 'correctivo');
    const completedWOs = workorders.filter(wo => ['completada', 'cerrada'].includes(wo.status));

    // Equipos operando
    const operatingAssets = assets.filter(a => a.status === 'operando').length;
    const totalAssets = assets.length;

    // Disponibilidad
    const availability = (operatingAssets / totalAssets) * 100;

    // OEE (simplificado: Disponibilidad × Performance × Calidad)
    const performance = 88 + Math.random() * 7;
    const quality = 95 + Math.random() * 4;
    const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

    // MTBF (Mean Time Between Failures)
    const totalOperatingHours = assets.reduce((sum, a) => sum + (a.hoursOperated || 0), 0);
    const totalFailures = correctiveWOs.length || 1;
    const mtbf = totalOperatingHours / totalFailures;

    // MTTR (Mean Time To Repair)
    const completedCorrectiveWOs = completedWOs.filter(wo => wo.type === 'correctivo' && wo.actualHours);
    const totalRepairHours = completedCorrectiveWOs.reduce((sum, wo) => sum + (wo.actualHours || 0), 0);
    const mttr = completedCorrectiveWOs.length > 0 ? totalRepairHours / completedCorrectiveWOs.length : 0;

    // Backlog
    const pendingWOs = workorders.filter(wo => !['completada', 'cerrada', 'cancelada'].includes(wo.status));
    const backlog = pendingWOs.length;
    const avgCompletionRate = 8; // OTs por semana promedio
    const backlogWeeks = backlog / avgCompletionRate;

    // Cumplimiento PM
    const activePlans = plans.filter(p => p.status === 'activo');
    const pmCompliance = activePlans.length > 0
      ? activePlans.reduce((sum, p) => sum + (p.compliance || 0), 0) / activePlans.length
      : 0;

    return { oee, availability, mtbf, mttr, backlog, backlogWeeks, pmCompliance, performance, quality };
  }

  function generateAlerts(assets, workorders, inventory, plans) {
    const alerts = [];

    // Equipos en falla
    assets.filter(a => a.status === 'en_falla').forEach(a => {
      alerts.push({
        severity: 'danger', icon: '🔴',
        title: `${a.tag} — En Falla`,
        description: `${a.name} (${a.area}) está fuera de operación`,
        time: 'Ahora'
      });
    });

    // Equipos en mantenimiento
    assets.filter(a => a.status === 'mantenimiento').forEach(a => {
      alerts.push({
        severity: 'warning', icon: '🟡',
        title: `${a.tag} — En Mantenimiento`,
        description: `${a.name} en intervención programada`,
        time: 'En curso'
      });
    });

    // OTs vencidas (scheduledDate pasada y no completada)
    const now = new Date();
    workorders.filter(wo =>
      !['completada', 'cerrada', 'cancelada'].includes(wo.status) &&
      wo.scheduledDate && new Date(wo.scheduledDate) < now
    ).slice(0, 3).forEach(wo => {
      alerts.push({
        severity: 'danger', icon: '⏰',
        title: `OT Vencida — ${wo.folio}`,
        description: `${wo.assetTag}: ${wo.title?.substring(0, 50)}...`,
        time: Components.Format.relative(wo.scheduledDate)
      });
    });

    // Stock bajo
    inventory.filter(i => i.currentStock <= i.minStock).forEach(i => {
      alerts.push({
        severity: 'warning', icon: '📦',
        title: `Stock Bajo — ${i.code}`,
        description: `${i.name}: ${i.currentStock}/${i.minStock} ${i.unit}`,
        time: 'Reabastecer'
      });
    });

    // Planes preventivos próximos a vencer
    plans.filter(p => {
      if (!p.nextDueDate) return false;
      const dueDate = new Date(p.nextDueDate);
      const daysUntil = (dueDate - now) / (24 * 60 * 60 * 1000);
      return daysUntil <= 3 && daysUntil >= 0;
    }).forEach(p => {
      alerts.push({
        severity: 'info', icon: '🔔',
        title: `PM Próximo — ${p.assetTag}`,
        description: p.name,
        time: Components.Format.date(p.nextDueDate)
      });
    });

    return alerts.slice(0, 12);
  }

  function getRecentWorkOrders(workorders) {
    return workorders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }

  async function initCharts() {
    const workorders = await CMMSDatabase.getAll('workorders');
    const assets = await CMMSDatabase.getAll('assets');

    renderFailuresTrend(workorders);
    renderWODistribution(workorders);
    renderTopFailures(workorders);
    renderCostByArea(workorders);
    renderAssetStatus(assets);
    renderRatio(workorders);
  }

  function renderFailuresTrend(workorders) {
    const months = [];
    const correctiveData = [];
    const preventiveData = [];
    const predictiveData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      months.push(monthLabel);

      const monthWOs = workorders.filter(wo => {
        const woDate = new Date(wo.createdAt);
        return woDate.getMonth() === d.getMonth() && woDate.getFullYear() === d.getFullYear();
      });

      correctiveData.push(monthWOs.filter(wo => wo.type === 'correctivo').length);
      preventiveData.push(monthWOs.filter(wo => wo.type === 'preventivo').length);
      predictiveData.push(monthWOs.filter(wo => wo.type === 'predictivo').length);
    }

    Components.Charts.create('chart-failures-trend', {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Correctivo',
            data: correctiveData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Preventivo',
            data: preventiveData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Predictivo',
            data: predictiveData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad de OT' } }
        }
      }
    });
  }

  function renderWODistribution(workorders) {
    const types = {
      correctivo: workorders.filter(wo => wo.type === 'correctivo').length,
      preventivo: workorders.filter(wo => wo.type === 'preventivo').length,
      predictivo: workorders.filter(wo => wo.type === 'predictivo').length,
      mejora: workorders.filter(wo => wo.type === 'mejora').length
    };

    Components.Charts.create('chart-wo-distribution', {
      type: 'doughnut',
      data: {
        labels: ['Correctivo', 'Preventivo', 'Predictivo', 'Mejora'],
        datasets: [{
          data: [types.correctivo, types.preventivo, types.predictivo, types.mejora],
          backgroundColor: ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981'],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  function renderTopFailures(workorders) {
    const failureCount = {};
    workorders.filter(wo => wo.type === 'correctivo').forEach(wo => {
      const key = wo.assetTag || 'N/A';
      failureCount[key] = (failureCount[key] || 0) + 1;
    });

    const sorted = Object.entries(failureCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    Components.Charts.create('chart-top-failures', {
      type: 'bar',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          label: 'Fallas',
          data: sorted.map(s => s[1]),
          backgroundColor: sorted.map((_, i) => {
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6'];
            return colors[i] || '#64748b';
          }),
          borderRadius: 4,
          barThickness: 24
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Número de fallas' } }
        }
      }
    });
  }

  function renderCostByArea(workorders) {
    const costByArea = {};
    workorders.filter(wo => ['completada', 'cerrada'].includes(wo.status)).forEach(wo => {
      const area = wo.area || 'Sin área';
      costByArea[area] = (costByArea[area] || 0) + (wo.materialCost || 0) + (wo.laborCost || 0);
    });

    const sorted = Object.entries(costByArea).sort((a, b) => b[1] - a[1]);

    Components.Charts.create('chart-cost-area', {
      type: 'bar',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          label: 'Costo Total (MXN)',
          data: sorted.map(s => s[1]),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '$' + (val / 1000).toFixed(0) + 'K'
            }
          }
        }
      }
    });
  }

  function renderAssetStatus(assets) {
    const areas = [...new Set(assets.map(a => a.area))];
    const operando = areas.map(area => assets.filter(a => a.area === area && a.status === 'operando').length);
    const falla = areas.map(area => assets.filter(a => a.area === area && a.status === 'en_falla').length);
    const mantenimiento = areas.map(area => assets.filter(a => a.area === area && a.status === 'mantenimiento').length);

    Components.Charts.create('chart-asset-status', {
      type: 'bar',
      data: {
        labels: areas,
        datasets: [
          { label: 'Operando', data: operando, backgroundColor: '#10b981', borderRadius: 3 },
          { label: 'En Falla', data: falla, backgroundColor: '#ef4444', borderRadius: 3 },
          { label: 'Mtto', data: mantenimiento, backgroundColor: '#f59e0b', borderRadius: 3 }
        ]
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }

  function renderRatio(workorders) {
    const months = [];
    const ratios = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleDateString('es-MX', { month: 'short' }));

      const monthWOs = workorders.filter(wo => {
        const woDate = new Date(wo.createdAt);
        return woDate.getMonth() === d.getMonth() && woDate.getFullYear() === d.getFullYear();
      });

      const corrective = monthWOs.filter(wo => wo.type === 'correctivo').length;
      const preventive = monthWOs.filter(wo => wo.type === 'preventivo' || wo.type === 'predictivo').length;
      const total = corrective + preventive || 1;
      ratios.push(((preventive / total) * 100).toFixed(1));
    }

    Components.Charts.create('chart-ratio', {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: '% Preventivo+Predictivo',
          data: ratios,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981'
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}% Preventivo` } }
        },
        scales: {
          y: {
            min: 0, max: 100,
            ticks: { callback: val => val + '%' },
            title: { display: true, text: '% Planificado' }
          }
        }
      }
    });
  }

  async function refresh() {
    Components.Charts.destroyAll();
    const mainContent = document.getElementById('main-content');
    const html = await render();
    mainContent.innerHTML = html;
    // Esperar a que Chart.js esté listo
    setTimeout(() => initCharts(), 100);
    Components.Toast.success('Dashboard actualizado');
  }

  return { render, initCharts, refresh };
})();
