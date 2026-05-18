/**
 * CMMS Enterprise — Módulo de Gestión de Activos
 * Jerarquía ISO 14224, fichas técnicas, historial y análisis de criticidad
 */

const AssetsModule = (() => {

  let currentView = 'list'; // 'list', 'tree', 'detail'
  let currentAssetId = null;
  let dataTableInstance = null;

  /* ═══════════════════════════════════════════
   * RENDER PRINCIPAL
   * ═══════════════════════════════════════════ */
  async function render() {
    const assets = await CMMSDatabase.getAll('assets');
    const workorders = await CMMSDatabase.getAll('workorders');

    // Resumen rápido
    const totalAssets = assets.length;
    const operating = assets.filter(a => a.status === 'operando').length;
    const inFault = assets.filter(a => a.status === 'en_falla').length;
    const inMaintenance = assets.filter(a => a.status === 'mantenimiento').length;
    const criticalA = assets.filter(a => a.criticality === 'A').length;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Activos</h1>
          <p class="page-subtitle">Inventario de equipos, fichas técnicas y análisis de criticidad — ${totalAssets} activos registrados</p>
        </div>
        <div class="page-actions">
          <div class="btn-group" id="assets-view-toggle">
            <button class="btn btn-sm ${currentView === 'list' ? 'btn-primary' : 'btn-ghost'}" onclick="AssetsModule.setView('list')" title="Vista de lista">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Lista
            </button>
            <button class="btn btn-sm ${currentView === 'tree' ? 'btn-primary' : 'btn-ghost'}" onclick="AssetsModule.setView('tree')" title="Vista jerárquica">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Jerarquía
            </button>
          </div>
          <button class="btn btn-primary" onclick="AssetsModule.showNewAssetModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Activo
          </button>
        </div>
      </div>

      <!-- KPIs de Activos -->
      <div class="kpi-grid">
        ${Components.KPICard({
          id: 'kpi-total-assets', title: 'Total Activos', value: totalAssets, unit: '',
          icon: '🏭', color: 'var(--primary)',
          trend: 'neutral', trendValue: '',
          subtitle: 'Equipos registrados'
        })}
        ${Components.KPICard({
          id: 'kpi-assets-operating', title: 'Operando', value: operating, unit: '',
          icon: '✅', color: 'var(--success)',
          trend: 'up', trendValue: Components.Format.percentage((operating / totalAssets) * 100),
          subtitle: 'En operación normal'
        })}
        ${Components.KPICard({
          id: 'kpi-assets-fault', title: 'En Falla', value: inFault, unit: '',
          icon: '🔴', color: 'var(--danger)',
          trend: inFault > 0 ? 'down' : 'up', trendValue: '',
          subtitle: 'Requieren atención'
        })}
        ${Components.KPICard({
          id: 'kpi-assets-maint', title: 'En Mantenimiento', value: inMaintenance, unit: '',
          icon: '🔧', color: 'var(--warning)',
          trend: 'neutral', trendValue: '',
          subtitle: 'Intervención programada'
        })}
        ${Components.KPICard({
          id: 'kpi-assets-critical', title: 'Criticidad A', value: criticalA, unit: '',
          icon: '⚠️', color: 'var(--accent)',
          trend: 'neutral', trendValue: Components.Format.percentage((criticalA / totalAssets) * 100),
          subtitle: 'Equipos críticos'
        })}
      </div>

      <!-- Área de filtros y contenido -->
      <div class="card" id="assets-content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: var(--space-3);">
          <h3 class="card-title" id="assets-content-title">
            ${currentView === 'tree' ? '🌳 Jerarquía de Activos (ISO 14224)' : '📋 Listado de Activos'}
          </h3>
          <div class="assets-filters" style="display:flex; gap: var(--space-2); flex-wrap: wrap;">
            <select class="form-control form-control-sm" id="filter-area" onchange="AssetsModule.applyFilters()" style="width:160px">
              <option value="">Todas las Áreas</option>
              ${[...new Set(assets.map(a => a.area))].sort().map(area =>
                `<option value="${area}">${area}</option>`
              ).join('')}
            </select>
            <select class="form-control form-control-sm" id="filter-criticality" onchange="AssetsModule.applyFilters()" style="width:140px">
              <option value="">Toda Criticidad</option>
              <option value="A">A — Crítico</option>
              <option value="B">B — Importante</option>
              <option value="C">C — General</option>
            </select>
            <select class="form-control form-control-sm" id="filter-status" onchange="AssetsModule.applyFilters()" style="width:150px">
              <option value="">Todo Estado</option>
              <option value="operando">Operando</option>
              <option value="en_falla">En Falla</option>
              <option value="mantenimiento">En Mantenimiento</option>
              <option value="fuera_servicio">Fuera de Servicio</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div id="assets-content-area">
            <!-- Contenido dinámico: tabla o árbol -->
          </div>
        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * POST-RENDER: Inicializar vista
   * ═══════════════════════════════════════════ */
  async function afterRender() {
    if (currentView === 'list') {
      await renderListView();
    } else {
      await renderTreeView();
    }
  }

  /* ═══════════════════════════════════════════
   * VISTA DE LISTA (DataTable)
   * ═══════════════════════════════════════════ */
  async function renderListView() {
    const assets = await CMMSDatabase.getAll('assets');
    const container = document.getElementById('assets-content-area');
    if (!container) return;

    container.innerHTML = '<div id="assets-datatable"></div>';

    dataTableInstance = new Components.DataTable('assets-datatable', {
      data: assets,
      pageSize: 15,
      searchable: true,
      exportable: true,
      selectable: false,
      emptyMessage: 'No se encontraron activos con los filtros seleccionados',
      onRowClick: (row) => {
        Router.navigate(`/assets/${row.id}`);
      },
      columns: [
        {
          key: 'tag', label: 'TAG', width: '120px',
          render: (val) => `<strong style="color: var(--primary); font-family: var(--font-mono); font-size: var(--fs-xs);">${val}</strong>`
        },
        {
          key: 'name', label: 'Nombre del Equipo', width: '220px',
          render: (val, row) => `
            <div class="asset-name-cell">
              <span class="asset-name">${val}</span>
              <span class="asset-brand" style="font-size: var(--fs-xs); color: var(--text-muted);">${row.brand || ''} ${row.model || ''}</span>
            </div>
          `
        },
        {
          key: 'area', label: 'Área', width: '130px',
          render: (val) => `<span class="badge badge-neutral" style="font-size:var(--fs-xs)">${val}</span>`
        },
        {
          key: 'system', label: 'Sistema', width: '110px'
        },
        {
          key: 'criticality', label: 'Criticidad', width: '95px', align: 'center',
          render: (val) => Components.StatusBadge(val)
        },
        {
          key: 'status', label: 'Estado', width: '120px', align: 'center',
          render: (val) => Components.StatusBadge(val)
        },
        {
          key: 'hoursOperated', label: 'Horas Op.', width: '90px', align: 'right',
          render: (val) => `<span style="font-family:var(--font-mono);font-size:var(--fs-xs)">${Components.Format.number(val)}</span>`
        },
        {
          key: 'lastMaintenance', label: 'Último Mtto.', width: '110px',
          render: (val) => `<span style="font-size:var(--fs-xs)">${Components.Format.relative(val)}</span>`
        }
      ],
      actions: [
        {
          name: 'view',
          label: 'Ver Detalle',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
          handler: (row) => Router.navigate(`/assets/${row.id}`)
        },
        {
          name: 'wo',
          label: 'Crear OT',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
          handler: (row) => Router.navigate(`/workorders/new?assetId=${row.id}`)
        }
      ],
      rowClass: (row) => {
        if (row.status === 'en_falla') return 'row-danger';
        if (row.status === 'mantenimiento') return 'row-warning';
        return '';
      }
    });
    dataTableInstance.render();
  }

  /* ═══════════════════════════════════════════
   * VISTA DE ÁRBOL JERÁRQUICO
   * ═══════════════════════════════════════════ */
  async function renderTreeView() {
    const assets = await CMMSDatabase.getAll('assets');
    const container = document.getElementById('assets-content-area');
    if (!container) return;

    // Agrupar por área → sistema → equipo
    const hierarchy = {};
    assets.forEach(asset => {
      if (!hierarchy[asset.area]) hierarchy[asset.area] = {};
      if (!hierarchy[asset.area][asset.system]) hierarchy[asset.area][asset.system] = [];
      hierarchy[asset.area][asset.system].push(asset);
    });

    const areaIcons = {
      'Estampado': '🔨',
      'Soldadura': '⚡',
      'Maquinado': '⚙️',
      'Tratamientos Térmicos': '🔥',
      'Pintura': '🎨',
      'Ensamble': '🔩',
      'Calidad': '📐',
      'Utilidades': '🏗️',
      'Logística': '📦'
    };

    let html = '<div class="asset-tree" style="padding: var(--space-4);">';

    // Nodo raíz: Planta
    html += `
      <div class="tree-node tree-root">
        <div class="tree-node-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="tree-toggle">▼</span>
          <span class="tree-icon">🏭</span>
          <span class="tree-label"><strong>Planta Manufactura Automotriz</strong></span>
          <span class="badge badge-neutral" style="margin-left:auto; font-size:var(--fs-xs)">${assets.length} equipos</span>
        </div>
        <div class="tree-children">
    `;

    Object.keys(hierarchy).sort().forEach(area => {
      const systems = hierarchy[area];
      const areaAssets = Object.values(systems).flat();
      const areaOperating = areaAssets.filter(a => a.status === 'operando').length;
      const areaFault = areaAssets.filter(a => a.status === 'en_falla').length;

      html += `
        <div class="tree-node tree-area">
          <div class="tree-node-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="tree-toggle">▼</span>
            <span class="tree-icon">${areaIcons[area] || '📂'}</span>
            <span class="tree-label"><strong>${area}</strong></span>
            <div style="margin-left:auto; display:flex; gap:var(--space-2); align-items:center;">
              <span class="badge badge-success" style="font-size:var(--fs-xs)">${areaOperating}</span>
              ${areaFault > 0 ? `<span class="badge badge-danger" style="font-size:var(--fs-xs)">${areaFault} falla</span>` : ''}
              <span style="font-size:var(--fs-xs); color:var(--text-muted)">${areaAssets.length} equipos</span>
            </div>
          </div>
          <div class="tree-children">
      `;

      Object.keys(systems).sort().forEach(system => {
        const equipos = systems[system];

        html += `
          <div class="tree-node tree-system">
            <div class="tree-node-header" onclick="this.parentElement.classList.toggle('collapsed')">
              <span class="tree-toggle">▼</span>
              <span class="tree-icon">📁</span>
              <span class="tree-label">${system}</span>
              <span style="font-size:var(--fs-xs); color:var(--text-muted); margin-left:auto;">${equipos.length}</span>
            </div>
            <div class="tree-children">
        `;

        equipos.forEach(equipo => {
          const statusColor = equipo.status === 'operando' ? 'var(--success)' :
                              equipo.status === 'en_falla' ? 'var(--danger)' :
                              equipo.status === 'mantenimiento' ? 'var(--warning)' : 'var(--text-muted)';
          const criticalityBadge = equipo.criticality === 'A' ? 'badge-danger' :
                                   equipo.criticality === 'B' ? 'badge-warning' : 'badge-neutral';

          html += `
            <div class="tree-node tree-equipment" onclick="Router.navigate('/assets/${equipo.id}')" style="cursor:pointer" title="Clic para ver detalle">
              <div class="tree-node-header tree-leaf">
                <span class="tree-status-dot" style="background:${statusColor}"></span>
                <span class="tree-tag" style="font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--primary)">${equipo.tag}</span>
                <span class="tree-label">${equipo.name}</span>
                <div style="margin-left:auto; display:flex; gap:var(--space-2); align-items:center;">
                  <span class="badge ${criticalityBadge}" style="font-size:10px; padding:1px 5px;">${equipo.criticality}</span>
                  ${Components.StatusBadge(equipo.status)}
                </div>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    </div>`;

    container.innerHTML = html;
  }

  /* ═══════════════════════════════════════════
   * DETALLE DE ACTIVO
   * ═══════════════════════════════════════════ */
  async function renderDetail(assetId) {
    const asset = await CMMSDatabase.getById('assets', assetId);
    if (!asset) {
      return `
        <div class="page-header">
          <div>
            <h1 class="page-title">Activo No Encontrado</h1>
            <p class="page-subtitle">El activo solicitado no existe en la base de datos.</p>
          </div>
        </div>
        <div class="card" style="max-width:500px; margin:var(--space-8) auto;">
          <div class="card-body" style="text-align:center; padding:var(--space-10)">
            <div style="font-size:3rem; margin-bottom:var(--space-4)">🔍</div>
            <p style="color:var(--text-secondary)">El activo con ID "${assetId}" no fue encontrado.</p>
            <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Router.navigate('/assets')">Volver a Activos</button>
          </div>
        </div>
      `;
    }

    // Obtener datos relacionados
    const [workorders, plans, amefRecords] = await Promise.all([
      CMMSDatabase.getByIndex('workorders', 'assetId', assetId),
      CMMSDatabase.getByIndex('preventive_plans', 'assetId', assetId),
      CMMSDatabase.getByIndex('amef', 'assetId', assetId)
    ]);

    // Estadísticas del activo
    const totalWOs = workorders.length;
    const correctiveWOs = workorders.filter(wo => wo.type === 'correctivo').length;
    const preventiveWOs = workorders.filter(wo => wo.type === 'preventivo').length;
    const totalCost = workorders
      .filter(wo => ['completada', 'cerrada'].includes(wo.status))
      .reduce((sum, wo) => sum + (wo.materialCost || 0) + (wo.laborCost || 0), 0);
    const avgRepairTime = workorders.filter(wo => wo.type === 'correctivo' && wo.actualHours)
      .reduce((acc, wo, _, arr) => acc + (wo.actualHours / arr.length), 0);

    const statusColor = asset.status === 'operando' ? 'var(--success)' :
                        asset.status === 'en_falla' ? 'var(--danger)' :
                        asset.status === 'mantenimiento' ? 'var(--warning)' : 'var(--text-muted)';

    // Tabs del detalle
    const tabs = [
      { id: 'info', label: 'Información', icon: 'ℹ️' },
      { id: 'history', label: 'Historial OTs', icon: '📋', count: totalWOs },
      { id: 'preventive', label: 'Plan Preventivo', icon: '📅', count: plans.length },
      { id: 'costs', label: 'Costos', icon: '💰' },
      { id: 'amef', label: 'AMEF', icon: '⚠️', count: amefRecords.length }
    ];

    return `
      <div class="page-header">
        <div>
          <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-2)">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/assets')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              Activos
            </button>
            <span style="color:var(--text-muted)">›</span>
            <span style="font-family:var(--font-mono); color:var(--primary); font-weight:600">${asset.tag}</span>
          </div>
          <h1 class="page-title">${asset.name}</h1>
          <p class="page-subtitle">${asset.brand} ${asset.model} — ${asset.area} / ${asset.system} — ${asset.location}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="AssetsModule.editAsset('${asset.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            Editar
          </button>
          <button class="btn btn-primary" onclick="Router.navigate('/workorders/new?assetId=${asset.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crear OT
          </button>
        </div>
      </div>

      <!-- Status & Quick Stats -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
        <div class="kpi-card" style="--kpi-color: ${statusColor}">
          <div class="kpi-header">
            <span class="kpi-icon" style="font-size:1.2rem">●</span>
          </div>
          <div class="kpi-value" style="font-size:var(--fs-lg)">${Components.StatusBadge(asset.status)}</div>
          <div class="kpi-title">Estado Actual</div>
        </div>
        <div class="kpi-card" style="--kpi-color: ${asset.criticality === 'A' ? 'var(--danger)' : asset.criticality === 'B' ? 'var(--warning)' : 'var(--text-muted)'}">
          <div class="kpi-header">
            <span class="kpi-icon">⚠️</span>
          </div>
          <div class="kpi-value">${Components.StatusBadge(asset.criticality)}</div>
          <div class="kpi-title">Criticidad</div>
        </div>
        ${Components.KPICard({
          title: 'Horas Operadas', value: Components.Format.number(asset.hoursOperated || 0), unit: '',
          icon: '⏱️', color: 'var(--info)', subtitle: `Año: ${asset.year}`
        })}
        ${Components.KPICard({
          title: 'OTs Totales', value: totalWOs, unit: '',
          icon: '📋', color: 'var(--primary)', subtitle: `${correctiveWOs} correctivas / ${preventiveWOs} preventivas`
        })}
        ${Components.KPICard({
          title: 'Costo Acumulado', value: Components.Format.currency(totalCost), unit: '',
          icon: '💰', color: totalCost > 100000 ? 'var(--danger)' : 'var(--success)',
          subtitle: 'Materiales + Mano obra'
        })}
        ${Components.KPICard({
          title: 'MTTR Promedio', value: avgRepairTime.toFixed(1), unit: 'hrs',
          icon: '🔧', color: avgRepairTime <= 4 ? 'var(--success)' : 'var(--warning)',
          subtitle: 'Tiempo medio reparación'
        })}
      </div>

      <!-- Tabs -->
      ${Components.Tabs('asset-detail-tabs', tabs, 'info')}
    `;
  }

  /* ═══════════════════════════════════════════
   * POST-RENDER DETAIL: Cargar contenido de tabs
   * ═══════════════════════════════════════════ */
  async function afterRenderDetail(assetId) {
    const asset = await CMMSDatabase.getById('assets', assetId);
    if (!asset) return;

    const [workorders, plans, amefRecords] = await Promise.all([
      CMMSDatabase.getByIndex('workorders', 'assetId', assetId),
      CMMSDatabase.getByIndex('preventive_plans', 'assetId', assetId),
      CMMSDatabase.getByIndex('amef', 'assetId', assetId)
    ]);

    // Tab Info
    const infoPanel = document.querySelector('[data-panel="info"]');
    if (infoPanel) {
      infoPanel.innerHTML = renderInfoTab(asset);
    }

    // Tab History
    const historyPanel = document.querySelector('[data-panel="history"]');
    if (historyPanel) {
      historyPanel.innerHTML = renderHistoryTab(workorders);
    }

    // Tab Preventive
    const preventivePanel = document.querySelector('[data-panel="preventive"]');
    if (preventivePanel) {
      preventivePanel.innerHTML = renderPreventiveTab(plans);
    }

    // Tab Costs
    const costsPanel = document.querySelector('[data-panel="costs"]');
    if (costsPanel) {
      costsPanel.innerHTML = renderCostsTab(workorders, asset);
    }

    // Tab AMEF
    const amefPanel = document.querySelector('[data-panel="amef"]');
    if (amefPanel) {
      amefPanel.innerHTML = renderAMEFTab(amefRecords);
    }

    // Inicializar tabs interactivos
    Components.initTabs('asset-detail-tabs', (tabId) => {
      // Inicializar gráficos de costos si se selecciona esa pestaña
      if (tabId === 'costs') {
        setTimeout(() => initCostCharts(workorders), 100);
      }
    });

    // Cargar gráficos de costo si info es la pestaña predeterminada está activa
    // (no por defecto, solo si navegan a costs)
  }

  /* ═══════════════════════════════════════════
   * TAB: INFORMACIÓN TÉCNICA
   * ═══════════════════════════════════════════ */
  function renderInfoTab(asset) {
    return `
      <div class="detail-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4); padding:var(--space-4);">
        <!-- Datos Generales -->
        <div class="detail-section">
          <h4 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Datos Generales
          </h4>
          <table class="detail-table">
            <tr><td class="detail-label">TAG</td><td class="detail-value"><code>${asset.tag}</code></td></tr>
            <tr><td class="detail-label">Nombre</td><td class="detail-value">${asset.name}</td></tr>
            <tr><td class="detail-label">Tipo</td><td class="detail-value">${asset.type || 'Equipo'}</td></tr>
            <tr><td class="detail-label">Área</td><td class="detail-value">${asset.area}</td></tr>
            <tr><td class="detail-label">Sistema</td><td class="detail-value">${asset.system}</td></tr>
            <tr><td class="detail-label">Ubicación</td><td class="detail-value">${asset.location}</td></tr>
            <tr><td class="detail-label">Criticidad</td><td class="detail-value">${Components.StatusBadge(asset.criticality)}</td></tr>
            <tr><td class="detail-label">Estado</td><td class="detail-value">${Components.StatusBadge(asset.status)}</td></tr>
          </table>
        </div>

        <!-- Especificaciones Técnicas -->
        <div class="detail-section">
          <h4 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Especificaciones Técnicas
          </h4>
          <table class="detail-table">
            <tr><td class="detail-label">Marca</td><td class="detail-value"><strong>${asset.brand || '—'}</strong></td></tr>
            <tr><td class="detail-label">Modelo</td><td class="detail-value">${asset.model || '—'}</td></tr>
            <tr><td class="detail-label">No. Serie</td><td class="detail-value"><code>${asset.serial || '—'}</code></td></tr>
            <tr><td class="detail-label">Año de Fabricación</td><td class="detail-value">${asset.year || '—'}</td></tr>
            <tr><td class="detail-label">Potencia</td><td class="detail-value">${asset.power || '—'}</td></tr>
            <tr><td class="detail-label">Peso</td><td class="detail-value">${asset.weight || '—'}</td></tr>
            <tr><td class="detail-label">Horas Operadas</td><td class="detail-value"><strong>${Components.Format.number(asset.hoursOperated || 0)}</strong> hrs</td></tr>
          </table>
        </div>

        <!-- Información Financiera -->
        <div class="detail-section">
          <h4 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Información Financiera
          </h4>
          <table class="detail-table">
            <tr><td class="detail-label">Costo de Adquisición</td><td class="detail-value"><strong>${Components.Format.currency(asset.purchaseCost || 0)}</strong></td></tr>
            <tr><td class="detail-label">Último Mantenimiento</td><td class="detail-value">${Components.Format.date(asset.lastMaintenance)}</td></tr>
            <tr><td class="detail-label">Registrado en BD</td><td class="detail-value">${Components.Format.date(asset.createdAt)}</td></tr>
          </table>
        </div>

        <!-- Clasificación de Criticidad -->
        <div class="detail-section">
          <h4 class="detail-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Clasificación de Criticidad
          </h4>
          ${renderCriticalityAnalysis(asset)}
        </div>
      </div>
    `;
  }

  function renderCriticalityAnalysis(asset) {
    const criteria = {
      'A': {
        label: 'Crítico',
        color: 'var(--danger)',
        description: 'Equipo sin respaldo, impacto directo en producción. Falla causa paro de línea.',
        strategy: 'Monitoreo predictivo + Preventivo estricto + Stock crítico de repuestos'
      },
      'B': {
        label: 'Importante',
        color: 'var(--warning)',
        description: 'Equipo con redundancia parcial. Falla afecta producción pero hay alternativas.',
        strategy: 'Preventivo programado + Inspecciones periódicas'
      },
      'C': {
        label: 'General',
        color: 'var(--text-muted)',
        description: 'Equipo auxiliar o con redundancia total. Falla no afecta producción directamente.',
        strategy: 'Correctivo planificado + Preventivo básico'
      }
    };

    const crit = criteria[asset.criticality] || criteria['C'];

    return `
      <div style="padding: var(--space-3); background: var(--bg-surface); border-radius: var(--radius-md); border-left: 4px solid ${crit.color};">
        <div style="font-weight:600; color: ${crit.color}; margin-bottom:var(--space-2);">
          Clasificación: ${crit.label} (${asset.criticality})
        </div>
        <p style="font-size:var(--fs-sm); color:var(--text-secondary); margin-bottom:var(--space-2);">
          ${crit.description}
        </p>
        <div style="font-size:var(--fs-sm); color:var(--text-secondary);">
          <strong style="color:var(--text-primary)">Estrategia recomendada:</strong> ${crit.strategy}
        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * TAB: HISTORIAL DE OTs
   * ═══════════════════════════════════════════ */
  function renderHistoryTab(workorders) {
    if (workorders.length === 0) {
      return Components.EmptyState({
        icon: '📋',
        title: 'Sin historial de OTs',
        message: 'Este activo aún no tiene órdenes de trabajo registradas.'
      });
    }

    // Ordenar por fecha descendente
    const sorted = [...workorders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return `
      <div class="timeline" style="padding:var(--space-4);">
        ${sorted.map((wo, i) => {
          const typeColor = wo.type === 'correctivo' ? 'var(--danger)' :
                            wo.type === 'preventivo' ? 'var(--primary)' :
                            wo.type === 'predictivo' ? 'var(--accent)' : 'var(--success)';
          return `
            <div class="timeline-item" style="cursor:pointer" onclick="Router.navigate('/workorders/${wo.id}')">
              <div class="timeline-dot" style="background:${typeColor}"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong style="color:var(--primary); font-family:var(--font-mono); font-size:var(--fs-xs)">${wo.folio}</strong>
                  <span style="font-size:var(--fs-xs); color:var(--text-muted)">${Components.Format.date(wo.createdAt)}</span>
                </div>
                <div class="timeline-title">${wo.title || wo.description?.substring(0, 80)}</div>
                <div class="timeline-meta">
                  ${Components.StatusBadge(wo.type)}
                  ${Components.StatusBadge(wo.priority)}
                  ${Components.StatusBadge(wo.status)}
                  ${wo.actualHours ? `<span style="font-size:var(--fs-xs); color:var(--text-muted)">⏱ ${wo.actualHours}h</span>` : ''}
                  ${(wo.materialCost || wo.laborCost) ? `<span style="font-size:var(--fs-xs); color:var(--text-muted)">💰 ${Components.Format.currency((wo.materialCost || 0) + (wo.laborCost || 0))}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * TAB: PLAN PREVENTIVO
   * ═══════════════════════════════════════════ */
  function renderPreventiveTab(plans) {
    if (plans.length === 0) {
      return Components.EmptyState({
        icon: '📅',
        title: 'Sin planes preventivos',
        message: 'Este activo no tiene planes de mantenimiento preventivo configurados.',
        action: { label: 'Crear Plan', onClick: "Router.navigate('/preventive')" }
      });
    }

    return `
      <div style="padding:var(--space-4); display:grid; gap:var(--space-4);">
        ${plans.map(plan => {
          const daysUntil = plan.nextDueDate ?
            Math.ceil((new Date(plan.nextDueDate) - new Date()) / (24 * 60 * 60 * 1000)) : null;
          const urgency = daysUntil !== null ?
            (daysUntil <= 0 ? 'danger' : daysUntil <= 3 ? 'warning' : daysUntil <= 7 ? 'info' : 'success') : 'neutral';

          return `
            <div class="card" style="border-left: 4px solid var(--${urgency === 'danger' ? 'danger' : urgency === 'warning' ? 'warning' : 'primary'});">
              <div class="card-body" style="padding:var(--space-4)">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-3); flex-wrap:wrap; gap:var(--space-2)">
                  <div>
                    <h4 style="color:var(--text-primary); margin-bottom:var(--space-1)">${plan.name}</h4>
                    <div style="display:flex; gap:var(--space-2); flex-wrap:wrap">
                      <span class="badge badge-primary" style="font-size:var(--fs-xs)">${plan.frequency}</span>
                      <span class="badge badge-neutral" style="font-size:var(--fs-xs)">Cada ${plan.intervalDays} días</span>
                      <span class="badge badge-neutral" style="font-size:var(--fs-xs)">~${plan.estimatedHours}h</span>
                    </div>
                  </div>
                  <div style="text-align:right">
                    ${daysUntil !== null ? `
                      <div class="badge badge-${urgency}" style="font-size:var(--fs-sm); padding:4px 10px;">
                        ${daysUntil <= 0 ? '⚠️ VENCIDO' : daysUntil === 0 ? '📅 HOY' : `${daysUntil} días`}
                      </div>
                    ` : ''}
                    <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-top:var(--space-1)">
                      Próximo: ${Components.Format.date(plan.nextDueDate)}
                    </div>
                  </div>
                </div>
                <div style="font-size:var(--fs-sm); color:var(--text-secondary); margin-bottom:var(--space-3)">
                  <strong>Tareas:</strong> ${plan.tasks}
                </div>
                <div style="display:flex; align-items:center; gap:var(--space-4);">
                  <div style="flex:1">
                    <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-1)">Cumplimiento</div>
                    ${Components.ProgressBar(plan.compliance || 0, 100)}
                  </div>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted)">
                    Último: ${Components.Format.date(plan.lastExecuted)}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * TAB: COSTOS
   * ═══════════════════════════════════════════ */
  function renderCostsTab(workorders, asset) {
    const completedWOs = workorders.filter(wo => ['completada', 'cerrada'].includes(wo.status));
    const totalMaterial = completedWOs.reduce((s, wo) => s + (wo.materialCost || 0), 0);
    const totalLabor = completedWOs.reduce((s, wo) => s + (wo.laborCost || 0), 0);
    const totalCost = totalMaterial + totalLabor;
    const costRatio = asset.purchaseCost > 0 ? ((totalCost / asset.purchaseCost) * 100).toFixed(1) : 0;

    return `
      <div style="padding:var(--space-4);">
        <!-- Resumen de costos -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:var(--space-4); margin-bottom:var(--space-6);">
          <div style="background:var(--bg-surface); padding:var(--space-4); border-radius:var(--radius-md); text-align:center">
            <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-2)">Costo Total Mtto.</div>
            <div style="font-size:var(--fs-xl); font-weight:700; color:var(--primary)">${Components.Format.currency(totalCost)}</div>
          </div>
          <div style="background:var(--bg-surface); padding:var(--space-4); border-radius:var(--radius-md); text-align:center">
            <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-2)">Materiales</div>
            <div style="font-size:var(--fs-xl); font-weight:700; color:var(--warning)">${Components.Format.currency(totalMaterial)}</div>
          </div>
          <div style="background:var(--bg-surface); padding:var(--space-4); border-radius:var(--radius-md); text-align:center">
            <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-2)">Mano de Obra</div>
            <div style="font-size:var(--fs-xl); font-weight:700; color:var(--info)">${Components.Format.currency(totalLabor)}</div>
          </div>
          <div style="background:var(--bg-surface); padding:var(--space-4); border-radius:var(--radius-md); text-align:center">
            <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-2)">% vs. Valor Activo</div>
            <div style="font-size:var(--fs-xl); font-weight:700; color:${parseFloat(costRatio) > 50 ? 'var(--danger)' : 'var(--success)'}">${costRatio}%</div>
          </div>
        </div>

        <!-- Gráficos -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4);">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Costo por Mes</h3></div>
            <div class="card-body"><div class="chart-container" style="height:250px"><canvas id="chart-asset-cost-month"></canvas></div></div>
          </div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">Distribución Material vs M.O.</h3></div>
            <div class="card-body"><div class="chart-container" style="height:250px"><canvas id="chart-asset-cost-dist"></canvas></div></div>
          </div>
        </div>
      </div>
    `;
  }

  function initCostCharts(workorders) {
    const completedWOs = workorders.filter(wo => ['completada', 'cerrada'].includes(wo.status));

    // Costo por mes
    const months = [];
    const materialData = [];
    const laborData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }));

      const monthWOs = completedWOs.filter(wo => {
        const woDate = new Date(wo.completedAt || wo.createdAt);
        return woDate.getMonth() === d.getMonth() && woDate.getFullYear() === d.getFullYear();
      });

      materialData.push(monthWOs.reduce((s, wo) => s + (wo.materialCost || 0), 0));
      laborData.push(monthWOs.reduce((s, wo) => s + (wo.laborCost || 0), 0));
    }

    Components.Charts.create('chart-asset-cost-month', {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Materiales', data: materialData, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4 },
          { label: 'Mano de Obra', data: laborData, backgroundColor: 'rgba(6, 182, 212, 0.7)', borderRadius: 4 }
        ]
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'K' } }
        }
      }
    });

    // Distribución
    const totalMaterial = completedWOs.reduce((s, wo) => s + (wo.materialCost || 0), 0);
    const totalLabor = completedWOs.reduce((s, wo) => s + (wo.laborCost || 0), 0);

    Components.Charts.create('chart-asset-cost-dist', {
      type: 'doughnut',
      data: {
        labels: ['Materiales', 'Mano de Obra'],
        datasets: [{
          data: [totalMaterial, totalLabor],
          backgroundColor: ['#f59e0b', '#06b6d4'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        cutout: '60%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  /* ═══════════════════════════════════════════
   * TAB: AMEF
   * ═══════════════════════════════════════════ */
  function renderAMEFTab(amefRecords) {
    if (amefRecords.length === 0) {
      return Components.EmptyState({
        icon: '⚠️',
        title: 'Sin análisis AMEF',
        message: 'Este activo no tiene análisis AMEF registrados.',
        action: { label: 'Crear Análisis', onClick: "Router.navigate('/amef')" }
      });
    }

    return `
      <div style="padding:var(--space-4); overflow-x:auto;">
        <table class="datatable" style="width:100%">
          <thead>
            <tr>
              <th>Componente</th>
              <th>Modo de Falla</th>
              <th style="text-align:center">S</th>
              <th style="text-align:center">O</th>
              <th style="text-align:center">D</th>
              <th style="text-align:center; font-weight:700">NPR</th>
              <th>Acción</th>
              <th style="text-align:center">NPR Rev.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${amefRecords.map(amef => {
              const nprColor = amef.npr >= 200 ? 'var(--danger)' :
                               amef.npr >= 120 ? 'var(--warning)' :
                               amef.npr >= 80 ? 'var(--info)' : 'var(--success)';
              const newNprColor = amef.newNpr ?
                (amef.newNpr >= 200 ? 'var(--danger)' :
                 amef.newNpr >= 120 ? 'var(--warning)' :
                 amef.newNpr >= 80 ? 'var(--info)' : 'var(--success)') : '';

              return `
                <tr>
                  <td><strong>${amef.component}</strong></td>
                  <td>${amef.failureMode}</td>
                  <td style="text-align:center">${amef.severity}</td>
                  <td style="text-align:center">${amef.occurrence}</td>
                  <td style="text-align:center">${amef.detection}</td>
                  <td style="text-align:center"><span style="font-weight:700; color:${nprColor}; font-size:var(--fs-md)">${amef.npr}</span></td>
                  <td style="font-size:var(--fs-xs); max-width:200px">${amef.action}</td>
                  <td style="text-align:center">${amef.newNpr ? `<span style="font-weight:700; color:${newNprColor}">${amef.newNpr}</span>` : '—'}</td>
                  <td>${Components.StatusBadge(amef.status, {
                    'implementado': { label: 'Implementado', class: 'badge-success' },
                    'en_proceso': { label: 'En Proceso', class: 'badge-warning' },
                    'pendiente': { label: 'Pendiente', class: 'badge-danger' }
                  })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * FILTROS
   * ═══════════════════════════════════════════ */
  async function applyFilters() {
    const area = document.getElementById('filter-area')?.value || '';
    const criticality = document.getElementById('filter-criticality')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';

    const allAssets = await CMMSDatabase.getAll('assets');
    let filtered = allAssets;

    if (area) filtered = filtered.filter(a => a.area === area);
    if (criticality) filtered = filtered.filter(a => a.criticality === criticality);
    if (status) filtered = filtered.filter(a => a.status === status);

    if (currentView === 'list' && dataTableInstance) {
      dataTableInstance.setData(filtered);
    } else if (currentView === 'tree') {
      // Para árbol, re-renderizar completo con filtros
      await renderTreeView();
    }
  }

  /* ═══════════════════════════════════════════
   * ACCIONES
   * ═══════════════════════════════════════════ */
  function setView(view) {
    currentView = view;
    // Re-renderizar el módulo
    refreshView();
  }

  async function refreshView() {
    const mainContent = document.getElementById('main-content');
    const html = await render();
    mainContent.innerHTML = html;
    await afterRender();
  }

  async function showNewAssetModal() {
    const allAssets = await CMMSDatabase.getAll('assets');
    const areas = [...new Set(allAssets.map(a => a.area))].sort();
    const systems = [...new Set(allAssets.map(a => a.system))].sort();

    const modal = new Components.Modal({
      title: '🏭 Nuevo Activo / Equipo',
      size: 'lg',
      content: `
        <form id="new-asset-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-3);">
            ${Components.FormField({ name: 'tag', label: 'TAG', required: true, placeholder: 'Ej: CNC-TN-003' })}
            ${Components.FormField({ name: 'name', label: 'Nombre del Equipo', required: true, placeholder: 'Ej: Torno CNC Haas' })}
            ${Components.FormField({
              name: 'area', label: 'Área', type: 'select', required: true,
              options: areas.map(a => ({ value: a, label: a }))
            })}
            ${Components.FormField({
              name: 'system', label: 'Sistema', type: 'select', required: true,
              options: systems.map(s => ({ value: s, label: s }))
            })}
            ${Components.FormField({
              name: 'criticality', label: 'Criticidad', type: 'select', required: true,
              options: [
                { value: 'A', label: 'A — Crítico' },
                { value: 'B', label: 'B — Importante' },
                { value: 'C', label: 'C — General' }
              ]
            })}
            ${Components.FormField({
              name: 'status', label: 'Estado', type: 'select', required: true, value: 'operando',
              options: [
                { value: 'operando', label: 'Operando' },
                { value: 'en_falla', label: 'En Falla' },
                { value: 'mantenimiento', label: 'En Mantenimiento' },
                { value: 'fuera_servicio', label: 'Fuera de Servicio' }
              ]
            })}
            ${Components.FormField({ name: 'brand', label: 'Marca', placeholder: 'Ej: Mazak, FANUC, ABB' })}
            ${Components.FormField({ name: 'model', label: 'Modelo', placeholder: 'Ej: Quick Turn 250M' })}
            ${Components.FormField({ name: 'serial', label: 'No. Serie', placeholder: 'Número de serie' })}
            ${Components.FormField({ name: 'year', label: 'Año de Fabricación', type: 'number', options: { min: 1990, max: 2030 } })}
            ${Components.FormField({ name: 'power', label: 'Potencia', placeholder: 'Ej: 22 kW' })}
            ${Components.FormField({ name: 'weight', label: 'Peso', placeholder: 'Ej: 6.5 ton' })}
            ${Components.FormField({ name: 'location', label: 'Ubicación', placeholder: 'Ej: Nave 3 - Bay 1', className: 'span-2' })}
            ${Components.FormField({ name: 'purchaseCost', label: 'Costo de Adquisición (MXN)', type: 'number', options: { min: 0 } })}
            ${Components.FormField({ name: 'hoursOperated', label: 'Horas Operadas', type: 'number', value: '0', options: { min: 0 } })}
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-ghost modal-cancel-btn">Cancelar</button>
        <button class="btn btn-primary modal-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Guardar Activo
        </button>
      `
    });

    modal.open();

    modal.element.querySelector('.modal-cancel-btn').addEventListener('click', () => modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click', async () => {
      const form = document.getElementById('new-asset-form');
      if (!Components.validateForm(form)) {
        Components.Toast.warning('Por favor complete todos los campos obligatorios');
        return;
      }

      const data = Components.readForm(form);
      data.type = 'equipo';
      data.parentId = null;
      data.lastMaintenance = null;

      try {
        await CMMSDatabase.create('assets', data);
        Components.Toast.success(`Activo ${data.tag} creado exitosamente`);
        modal.close();
        await refreshView();
      } catch (error) {
        Components.Toast.error('Error al crear activo: ' + error.message);
      }
    });
  }

  async function editAsset(assetId) {
    const asset = await CMMSDatabase.getById('assets', assetId);
    if (!asset) return;

    const allAssets = await CMMSDatabase.getAll('assets');
    const areas = [...new Set(allAssets.map(a => a.area))].sort();
    const systems = [...new Set(allAssets.map(a => a.system))].sort();

    const modal = new Components.Modal({
      title: `✏️ Editar Activo — ${asset.tag}`,
      size: 'lg',
      content: `
        <form id="edit-asset-form">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-3);">
            ${Components.FormField({ name: 'tag', label: 'TAG', required: true, value: asset.tag })}
            ${Components.FormField({ name: 'name', label: 'Nombre del Equipo', required: true, value: asset.name })}
            ${Components.FormField({
              name: 'area', label: 'Área', type: 'select', required: true, value: asset.area,
              options: areas.map(a => ({ value: a, label: a }))
            })}
            ${Components.FormField({
              name: 'system', label: 'Sistema', type: 'select', required: true, value: asset.system,
              options: systems.map(s => ({ value: s, label: s }))
            })}
            ${Components.FormField({
              name: 'criticality', label: 'Criticidad', type: 'select', required: true, value: asset.criticality,
              options: [
                { value: 'A', label: 'A — Crítico' },
                { value: 'B', label: 'B — Importante' },
                { value: 'C', label: 'C — General' }
              ]
            })}
            ${Components.FormField({
              name: 'status', label: 'Estado', type: 'select', required: true, value: asset.status,
              options: [
                { value: 'operando', label: 'Operando' },
                { value: 'en_falla', label: 'En Falla' },
                { value: 'mantenimiento', label: 'En Mantenimiento' },
                { value: 'fuera_servicio', label: 'Fuera de Servicio' }
              ]
            })}
            ${Components.FormField({ name: 'brand', label: 'Marca', value: asset.brand || '' })}
            ${Components.FormField({ name: 'model', label: 'Modelo', value: asset.model || '' })}
            ${Components.FormField({ name: 'serial', label: 'No. Serie', value: asset.serial || '' })}
            ${Components.FormField({ name: 'year', label: 'Año', type: 'number', value: asset.year || '', options: { min: 1990, max: 2030 } })}
            ${Components.FormField({ name: 'power', label: 'Potencia', value: asset.power || '' })}
            ${Components.FormField({ name: 'weight', label: 'Peso', value: asset.weight || '' })}
            ${Components.FormField({ name: 'location', label: 'Ubicación', value: asset.location || '', className: 'span-2' })}
            ${Components.FormField({ name: 'purchaseCost', label: 'Costo de Adquisición', type: 'number', value: asset.purchaseCost || 0, options: { min: 0 } })}
            ${Components.FormField({ name: 'hoursOperated', label: 'Horas Operadas', type: 'number', value: asset.hoursOperated || 0, options: { min: 0 } })}
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-ghost modal-cancel-btn">Cancelar</button>
        <button class="btn btn-danger modal-delete-btn" style="margin-right:auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Eliminar
        </button>
        <button class="btn btn-primary modal-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Guardar Cambios
        </button>
      `
    });

    modal.open();

    modal.element.querySelector('.modal-cancel-btn').addEventListener('click', () => modal.close());

    modal.element.querySelector('.modal-delete-btn').addEventListener('click', async () => {
      const confirmed = await Components.Modal.confirm(
        `¿Está seguro de eliminar el activo ${asset.tag} (${asset.name})? Esta acción no se puede deshacer.`,
        'Eliminar Activo'
      );
      if (confirmed) {
        await CMMSDatabase.remove('assets', asset.id);
        Components.Toast.success(`Activo ${asset.tag} eliminado`);
        modal.close();
        Router.navigate('/assets');
      }
    });

    modal.element.querySelector('.modal-save-btn').addEventListener('click', async () => {
      const form = document.getElementById('edit-asset-form');
      if (!Components.validateForm(form)) {
        Components.Toast.warning('Complete todos los campos obligatorios');
        return;
      }

      const data = Components.readForm(form);
      data.id = asset.id;
      data.type = asset.type;
      data.parentId = asset.parentId;
      data.lastMaintenance = asset.lastMaintenance;
      data.createdAt = asset.createdAt;

      try {
        await CMMSDatabase.update('assets', data);
        Components.Toast.success(`Activo ${data.tag} actualizado exitosamente`);
        modal.close();
        // Re-renderizar detalle
        Router.resolve();
      } catch (error) {
        Components.Toast.error('Error al actualizar: ' + error.message);
      }
    });
  }

  /* ═══════════════════════════════════════════
   * CAMBIO DE ESTADO RÁPIDO
   * ═══════════════════════════════════════════ */
  async function quickStatusChange(assetId, newStatus) {
    try {
      const asset = await CMMSDatabase.getById('assets', assetId);
      if (!asset) return;
      asset.status = newStatus;
      await CMMSDatabase.update('assets', asset);
      Components.Toast.success(`Estado de ${asset.tag} cambiado a ${newStatus}`);
      Router.resolve(); // Re-renderizar
    } catch (error) {
      Components.Toast.error('Error: ' + error.message);
    }
  }

  /* ═══════════════════════════════════════════
   * PUBLIC API
   * ═══════════════════════════════════════════ */
  return {
    render,
    afterRender,
    renderDetail,
    afterRenderDetail,
    setView,
    applyFilters,
    showNewAssetModal,
    editAsset,
    quickStatusChange,
    refreshView
  };
})();
