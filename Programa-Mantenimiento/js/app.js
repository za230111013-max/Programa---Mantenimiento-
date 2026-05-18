/**
 * CMMS Enterprise — App Bootstrap
 * Inicialización, rutas, tema y funciones globales
 */

const App = (() => {

  /**
   * Inicializar la aplicación
   */
  async function init() {
    console.log('[App] Iniciando CMMS Enterprise...');
    const loadingBar = document.getElementById('loading-bar');

    try {
      // Paso 1: Inicializar base de datos
      updateLoading(loadingBar, 20);
      await CMMSDatabase.init();

      // Paso 2: Verificar si hay datos, si no → seed
      updateLoading(loadingBar, 40);
      const isEmpty = await CMMSDatabase.isEmpty();
      if (isEmpty) {
        console.log('[App] Base de datos vacía, cargando datos de demostración...');
        updateLoading(loadingBar, 50);
        await SeedData.seed();
      }

      // Paso 3: Inicializar Store
      updateLoading(loadingBar, 70);
      Store.init({
        currentUser: {
          id: 'usr_001',
          name: 'Carlos Mendoza',
          role: 'admin',
          area: 'Mantenimiento'
        }
      });

      // Paso 4: Aplicar tema guardado
      updateLoading(loadingBar, 80);
      applyTheme(Store.get('theme'));

      // Paso 5: Registrar rutas
      updateLoading(loadingBar, 90);
      registerRoutes();

      // Paso 6: Actualizar badges del sidebar
      await updateSidebarBadges();

      // Paso 7: Finalizar carga y mostrar app
      updateLoading(loadingBar, 100);
      await new Promise(r => setTimeout(r, 400));
      
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen.style.opacity = '0';
      
      const appLayout = document.getElementById('app-layout');
      appLayout.style.display = '';
      
      setTimeout(() => loadingScreen.remove(), 500);

      // Paso 8: Iniciar router
      Router.listen();

      // Paso 9: Configurar búsqueda global
      setupGlobalSearch();

      console.log('[App] ✅ CMMS Enterprise iniciado correctamente');

    } catch (error) {
      console.error('[App] Error al iniciar:', error);
      document.getElementById('loading-screen').innerHTML = `
        <div style="text-align:center; color:#ef4444; font-family:Inter,sans-serif;">
          <h2>Error al iniciar el sistema</h2>
          <p style="color:#94a3b8">${error.message}</p>
          <button onclick="location.reload()" style="margin-top:16px; padding:8px 24px; background:#3b82f6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">Reintentar</button>
        </div>
      `;
    }
  }

  function updateLoading(bar, percent) {
    if (bar) bar.style.width = percent + '%';
  }

  /**
   * Registrar todas las rutas del SPA
   */
  function registerRoutes() {
    Router.registerAll({
      '/dashboard': {
        title: 'Dashboard',
        icon: 'dashboard',
        breadcrumb: ['Dashboard'],
        render: async () => {
          const html = await DashboardModule.render();
          setTimeout(() => DashboardModule.initCharts(), 150);
          return html;
        }
      },
      '/assets': {
        title: 'Gestión de Activos',
        breadcrumb: ['Activos'],
        render: async () => {
          const html = await AssetsModule.render();
          setTimeout(() => AssetsModule.afterRender(), 100);
          return html;
        }
      },
      '/assets/:id': {
        title: 'Detalle de Activo',
        breadcrumb: ['Activos', 'Detalle'],
        render: async (params) => {
          const html = await AssetsModule.renderDetail(params.id);
          setTimeout(() => AssetsModule.afterRenderDetail(params.id), 100);
          return html;
        }
      },
      '/workorders': {
        title: 'Órdenes de Trabajo',
        breadcrumb: ['Órdenes de Trabajo'],
        render: async () => {
          const html = await WorkOrdersModule.render();
          setTimeout(() => WorkOrdersModule.afterRender(), 100);
          return html;
        }
      },
      '/workorders/new': {
        title: 'Nueva Orden de Trabajo',
        breadcrumb: ['Órdenes de Trabajo', 'Nueva'],
        render: async () => {
          const html = await WorkOrdersModule.renderNew();
          setTimeout(() => WorkOrdersModule.afterRenderNew(), 100);
          return html;
        }
      },
      '/workorders/:id': {
        title: 'Detalle OT',
        breadcrumb: ['Órdenes de Trabajo', 'Detalle'],
        render: async (params) => {
          const html = await WorkOrdersModule.renderDetail(params.id);
          setTimeout(() => WorkOrdersModule.afterRenderDetail(params.id), 100);
          return html;
        }
      },
      '/preventive': {
        title: 'Mantenimiento Preventivo',
        breadcrumb: ['Mtto. Preventivo'],
        render: async () => {
          const html = await PreventiveModule.render();
          setTimeout(() => PreventiveModule.afterRender(), 100);
          return html;
        }
      },
      '/inventory': {
        title: 'Inventario de Repuestos',
        breadcrumb: ['Inventario'],
        render: async () => {
          const html = await InventoryModule.render();
          setTimeout(() => InventoryModule.afterRender(), 100);
          return html;
        }
      },
      '/amef': {
        title: 'Análisis AMEF / RCM',
        breadcrumb: ['AMEF / RCM'],
        render: async () => {
          const html = await AMEFModule.render();
          setTimeout(() => AMEFModule.afterRender(), 100);
          return html;
        }
      },
      '/reports': {
        title: 'Reportes y Analytics',
        breadcrumb: ['Reportes'],
        render: async () => {
          const html = await ReportsModule.render();
          setTimeout(() => ReportsModule.afterRender(), 100);
          return html;
        }
      },
      '/admin': {
        title: 'Administración',
        breadcrumb: ['Administración'],
        render: async () => {
          const html = await AdminModule.render();
          setTimeout(() => AdminModule.afterRender(), 100);
          return html;
        }
      }
    });
  }

  /**
   * Renderizar módulo placeholder (para fases futuras)
   */
  async function renderPlaceholderModule(title, description, icon, dataStore) {
    let statsHTML = '';
    
    if (dataStore) {
      try {
        const count = await CMMSDatabase.count(dataStore === 'preventive' ? 'preventive_plans' : dataStore);
        statsHTML = `
          <div class="stats-row" style="justify-content: center; margin-top: var(--space-4);">
            <div class="stat-item" style="align-items: center;">
              <span class="stat-value" style="color: var(--primary)">${count}</span>
              <span class="stat-label">Registros en BD</span>
            </div>
          </div>
        `;
      } catch(e) { /* ignore */ }
    }

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">Módulo en construcción — Próxima fase de implementación</p>
        </div>
      </div>
      <div class="card" style="max-width: 600px; margin: var(--space-8) auto;">
        <div class="card-body" style="text-align: center; padding: var(--space-10) var(--space-6);">
          <div style="font-size: 4rem; margin-bottom: var(--space-4);">${icon}</div>
          <h2 style="color: var(--text-primary); margin-bottom: var(--space-3);">${title}</h2>
          <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: var(--space-4);">${description}</p>
          ${statsHTML}
          <div style="margin-top: var(--space-6);">
            <button class="btn btn-primary" onclick="Router.navigate('/dashboard')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Actualizar badges del sidebar
   */
  async function updateSidebarBadges() {
    try {
      const pendingWOs = await CMMSDatabase.query('workorders', {
        status: ['solicitada', 'aprobada', 'planificada', 'en_ejecucion']
      });
      const badge = document.getElementById('badge-workorders');
      if (badge) {
        badge.textContent = pendingWOs.length;
        badge.style.display = pendingWOs.length > 0 ? '' : 'none';
      }
    } catch(e) { /* ignore */ }
  }

  /**
   * Toggle sidebar
   */
  function toggleSidebar() {
    const layout = document.getElementById('app-layout');
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle('mobile-open');
    } else {
      layout.classList.toggle('sidebar-collapsed');
    }
  }

  /**
   * Toggle tema claro/oscuro
   */
  function toggleTheme() {
    const current = Store.get('theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    Store.set('theme', newTheme);
    applyTheme(newTheme);
    
    // Re-renderizar gráficos si estamos en dashboard
    if (Router.getCurrentPath().includes('dashboard')) {
      setTimeout(() => DashboardModule.refresh(), 200);
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const label = document.getElementById('theme-label');
    const icon = document.getElementById('theme-icon');
    
    if (label) label.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
    if (icon) {
      icon.innerHTML = theme === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  /**
   * Configurar búsqueda global
   */
  function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const term = e.target.value.trim().toLowerCase();
        if (term.length < 2) return;

        // Buscar en assets y workorders
        const [assets, workorders] = await Promise.all([
          CMMSDatabase.getAll('assets'),
          CMMSDatabase.getAll('workorders')
        ]);

        const results = [];
        assets.filter(a => 
          a.tag.toLowerCase().includes(term) || 
          a.name.toLowerCase().includes(term)
        ).slice(0, 5).forEach(a => {
          results.push({ type: 'Activo', label: `${a.tag} — ${a.name}`, route: `/assets/${a.id}` });
        });

        workorders.filter(wo => 
          wo.folio.toLowerCase().includes(term) || 
          (wo.title && wo.title.toLowerCase().includes(term))
        ).slice(0, 5).forEach(wo => {
          results.push({ type: 'OT', label: `${wo.folio} — ${wo.assetTag}`, route: `/workorders/${wo.id}` });
        });

        if (results.length > 0) {
          Components.Toast.info(`${results.length} resultados encontrados para "${term}"`);
        }
      }, 400);
    });
  }

  /**
   * Mostrar notificaciones
   */
  function showNotifications() {
    const modal = new Components.Modal({
      title: '🔔 Notificaciones',
      size: 'md',
      content: `
        <div class="alert-list">
          <div class="alert-item alert-item-danger">
            <span class="alert-item-icon">🔴</span>
            <div class="alert-item-content">
              <div class="alert-item-title">CNC-CV-002 en Falla</div>
              <div class="alert-item-desc">Centro de Maquinado Vertical DMG requiere atención inmediata</div>
            </div>
            <span class="alert-item-time">Hace 2h</span>
          </div>
          <div class="alert-item alert-item-warning">
            <span class="alert-item-icon">⚠️</span>
            <div class="alert-item-content">
              <div class="alert-item-title">3 OTs vencidas</div>
              <div class="alert-item-desc">Órdenes correctivas pendientes de cierre</div>
            </div>
            <span class="alert-item-time">Hace 4h</span>
          </div>
          <div class="alert-item alert-item-warning">
            <span class="alert-item-icon">📦</span>
            <div class="alert-item-content">
              <div class="alert-item-title">Stock bajo: ROD-7210-BEP</div>
              <div class="alert-item-desc">Rodamiento Angular 7210 — 3 pzs (mín: 4)</div>
            </div>
            <span class="alert-item-time">Hoy</span>
          </div>
          <div class="alert-item alert-item-info">
            <span class="alert-item-icon">🔔</span>
            <div class="alert-item-content">
              <div class="alert-item-title">MP Semanal vence hoy</div>
              <div class="alert-item-desc">Torno CNC #1 (CNC-TN-001) — Inspección semanal</div>
            </div>
            <span class="alert-item-time">Hoy</span>
          </div>
          <div class="alert-item alert-item-info">
            <span class="alert-item-icon">✅</span>
            <div class="alert-item-content">
              <div class="alert-item-title">OT-2024198 completada</div>
              <div class="alert-item-desc">MP Mensual Compresor #1 cerrada por Miguel López</div>
            </div>
            <span class="alert-item-time">Ayer</span>
          </div>
        </div>
      `
    });
    modal.open();
  }

  /**
   * Exportar datos
   */
  async function exportData() {
    try {
      const data = await CMMSDatabase.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cmms_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Components.Toast.success('Datos exportados correctamente');
    } catch (error) {
      Components.Toast.error('Error al exportar: ' + error.message);
    }
  }

  /**
   * Resetear datos de demostración
   */
  async function resetData() {
    const confirmed = await Components.Modal.confirm(
      '¿Está seguro de resetear todos los datos? Se eliminarán todos los registros y se cargarán los datos de demostración nuevamente.',
      'Resetear Base de Datos'
    );
    if (confirmed) {
      await CMMSDatabase.clearAll();
      await SeedData.seed();
      Components.Toast.success('Datos reseteados correctamente');
      setTimeout(() => location.reload(), 1000);
    }
  }

  return {
    init,
    toggleSidebar,
    toggleTheme,
    showNotifications,
    exportData,
    resetData
  };
})();

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());
