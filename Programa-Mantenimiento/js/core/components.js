/**
 * CMMS Enterprise — Componentes UI Reutilizables
 * DataTable, Modal, Forms, Charts, Notifications, etc.
 */

const Components = (() => {

  /* ═══════════════════════════════════════════
   * DATA TABLE — Tabla avanzada con sort, filtros, paginación
   * ═══════════════════════════════════════════ */
  class DataTable {
    constructor(containerId, config = {}) {
      this.container = typeof containerId === 'string' 
        ? document.getElementById(containerId) 
        : containerId;
      this.config = {
        columns: [],
        data: [],
        pageSize: config.pageSize || 15,
        searchable: config.searchable !== false,
        sortable: config.sortable !== false,
        exportable: config.exportable || false,
        selectable: config.selectable || false,
        actions: config.actions || [],
        emptyMessage: config.emptyMessage || 'No se encontraron registros',
        onRowClick: config.onRowClick || null,
        rowClass: config.rowClass || null,
        ...config
      };
      this.currentPage = 1;
      this.sortColumn = null;
      this.sortDirection = 'asc';
      this.searchTerm = '';
      this.selectedRows = new Set();
      this.filteredData = [...this.config.data];
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = '';
      this.container.className = 'datatable-wrapper';

      // Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'datatable-toolbar';
      toolbar.innerHTML = `
        ${this.config.searchable ? `
          <div class="datatable-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input type="text" placeholder="Buscar..." class="datatable-search-input" value="${this.searchTerm}">
          </div>
        ` : ''}
        <div class="datatable-toolbar-actions">
          ${this.config.exportable ? `
            <button class="btn btn-sm btn-ghost" data-action="export-csv">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>
          ` : ''}
          <span class="datatable-count">${this.filteredData.length} registros</span>
        </div>
      `;
      this.container.appendChild(toolbar);

      // Tabla
      const tableWrap = document.createElement('div');
      tableWrap.className = 'datatable-scroll';
      
      const table = document.createElement('table');
      table.className = 'datatable';

      // Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      if (this.config.selectable) {
        headerRow.innerHTML += `<th class="datatable-checkbox"><input type="checkbox" class="select-all"></th>`;
      }

      this.config.columns.forEach(col => {
        const th = document.createElement('th');
        th.innerHTML = `
          <span class="datatable-th-content">
            ${col.label}
            ${this.config.sortable && col.sortable !== false ? `
              <span class="sort-icon ${this.sortColumn === col.key ? this.sortDirection : ''}">${this.sortColumn === col.key ? (this.sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
            ` : ''}
          </span>
        `;
        if (col.width) th.style.width = col.width;
        if (this.config.sortable && col.sortable !== false) {
          th.style.cursor = 'pointer';
          th.addEventListener('click', () => this.sort(col.key));
        }
        headerRow.appendChild(th);
      });

      if (this.config.actions.length > 0) {
        headerRow.innerHTML += `<th class="datatable-actions-th">Acciones</th>`;
      }

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      const pageData = this.getPageData();

      if (pageData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${this.config.columns.length + (this.config.selectable ? 1 : 0) + (this.config.actions.length > 0 ? 1 : 0)}" class="datatable-empty">
          <div class="empty-state-mini">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
            <p>${this.config.emptyMessage}</p>
          </div>
        </td>`;
        tbody.appendChild(tr);
      } else {
        pageData.forEach(row => {
          const tr = document.createElement('tr');
          if (this.config.rowClass) {
            const cls = this.config.rowClass(row);
            if (cls) tr.className = cls;
          }
          if (this.config.onRowClick) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
              if (e.target.closest('.datatable-action-btn') || e.target.closest('input[type="checkbox"]')) return;
              this.config.onRowClick(row);
            });
          }
          if (this.selectedRows.has(row.id)) tr.classList.add('selected');

          if (this.config.selectable) {
            tr.innerHTML += `<td class="datatable-checkbox"><input type="checkbox" data-id="${row.id}" ${this.selectedRows.has(row.id) ? 'checked' : ''}></td>`;
          }

          this.config.columns.forEach(col => {
            const td = document.createElement('td');
            if (col.render) {
              td.innerHTML = col.render(row[col.key], row);
            } else {
              td.textContent = row[col.key] ?? '—';
            }
            if (col.align) td.style.textAlign = col.align;
            tr.appendChild(td);
          });

          if (this.config.actions.length > 0) {
            const actionTd = document.createElement('td');
            actionTd.className = 'datatable-actions-cell';
            actionTd.innerHTML = this.config.actions.map(action => `
              <button class="datatable-action-btn" data-action="${action.name}" data-id="${row.id}" title="${action.label}">
                ${action.icon || action.label}
              </button>
            `).join('');
            
            actionTd.querySelectorAll('.datatable-action-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionName = btn.getAttribute('data-action');
                const action = this.config.actions.find(a => a.name === actionName);
                if (action && action.handler) action.handler(row);
              });
            });
            
            tr.appendChild(actionTd);
          }

          tbody.appendChild(tr);
        });
      }

      table.appendChild(tbody);
      tableWrap.appendChild(table);
      this.container.appendChild(tableWrap);

      // Paginación
      if (this.filteredData.length > this.config.pageSize) {
        this.container.appendChild(this.renderPagination());
      }

      // Event listeners
      this.bindEvents();
    }

    getPageData() {
      const start = (this.currentPage - 1) * this.config.pageSize;
      return this.filteredData.slice(start, start + this.config.pageSize);
    }

    sort(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }

      this.filteredData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return this.sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });

      this.currentPage = 1;
      this.render();
    }

    search(term) {
      this.searchTerm = term.toLowerCase();
      if (!this.searchTerm) {
        this.filteredData = [...this.config.data];
      } else {
        this.filteredData = this.config.data.filter(row =>
          this.config.columns.some(col => {
            const val = row[col.key];
            return val != null && String(val).toLowerCase().includes(this.searchTerm);
          })
        );
      }
      this.currentPage = 1;
      this.render();
    }

    setData(data) {
      this.config.data = data;
      this.filteredData = [...data];
      this.currentPage = 1;
      if (this.searchTerm) this.search(this.searchTerm);
      else this.render();
    }

    renderPagination() {
      const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
      const pag = document.createElement('div');
      pag.className = 'datatable-pagination';

      const start = (this.currentPage - 1) * this.config.pageSize + 1;
      const end = Math.min(this.currentPage * this.config.pageSize, this.filteredData.length);

      pag.innerHTML = `
        <span class="pagination-info">Mostrando ${start}–${end} de ${this.filteredData.length}</span>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-ghost" data-page="prev" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>
          ${this.getPaginationButtons(totalPages)}
          <button class="btn btn-sm btn-ghost" data-page="next" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>
        </div>
      `;

      pag.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = btn.getAttribute('data-page');
          if (page === 'prev') this.currentPage--;
          else if (page === 'next') this.currentPage++;
          else this.currentPage = parseInt(page);
          this.render();
        });
      });

      return pag;
    }

    getPaginationButtons(totalPages) {
      const pages = [];
      const range = 2;
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.currentPage - range && i <= this.currentPage + range)) {
          pages.push(`<button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-ghost'}" data-page="${i}">${i}</button>`);
        } else if (pages[pages.length - 1] !== '...') {
          pages.push('...');
        }
      }
      return pages.map(p => typeof p === 'string' && p === '...' ? '<span class="pagination-ellipsis">…</span>' : p).join('');
    }

    bindEvents() {
      const searchInput = this.container.querySelector('.datatable-search-input');
      if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => this.search(e.target.value), 250);
        });
      }

      const exportBtn = this.container.querySelector('[data-action="export-csv"]');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => this.exportCSV());
      }

      if (this.config.selectable) {
        const selectAll = this.container.querySelector('.select-all');
        if (selectAll) {
          selectAll.addEventListener('change', (e) => {
            if (e.target.checked) {
              this.filteredData.forEach(r => this.selectedRows.add(r.id));
            } else {
              this.selectedRows.clear();
            }
            this.render();
          });
        }
        this.container.querySelectorAll('td.datatable-checkbox input').forEach(cb => {
          cb.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            if (e.target.checked) this.selectedRows.add(id);
            else this.selectedRows.delete(id);
            this.render();
          });
        });
      }
    }

    exportCSV() {
      const headers = this.config.columns.map(c => c.label);
      const rows = this.filteredData.map(row =>
        this.config.columns.map(col => {
          let val = row[col.key];
          if (val == null) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
      );
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cmms_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    getSelected() {
      return this.config.data.filter(r => this.selectedRows.has(r.id));
    }

    destroy() {
      if (this.container) this.container.innerHTML = '';
    }
  }


  /* ═══════════════════════════════════════════
   * MODAL — Sistema de modales
   * ═══════════════════════════════════════════ */
  class Modal {
    constructor(config = {}) {
      this.config = {
        title: config.title || '',
        size: config.size || 'md', // sm, md, lg, xl, full
        closable: config.closable !== false,
        content: config.content || '',
        footer: config.footer || null,
        onClose: config.onClose || null,
        onConfirm: config.onConfirm || null,
        className: config.className || '',
        ...config
      };
      this.element = null;
    }

    open() {
      // Crear overlay
      this.element = document.createElement('div');
      this.element.className = 'modal-overlay';
      this.element.innerHTML = `
        <div class="modal modal-${this.config.size} ${this.config.className}">
          <div class="modal-header">
            <h3 class="modal-title">${this.config.title}</h3>
            ${this.config.closable ? `
              <button class="modal-close" aria-label="Cerrar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="modal-body">${typeof this.config.content === 'string' ? this.config.content : ''}</div>
          ${this.config.footer !== null ? `
            <div class="modal-footer">${typeof this.config.footer === 'string' ? this.config.footer : ''}</div>
          ` : ''}
        </div>
      `;

      // Si content es un elemento DOM, insertarlo
      if (this.config.content instanceof HTMLElement) {
        this.element.querySelector('.modal-body').innerHTML = '';
        this.element.querySelector('.modal-body').appendChild(this.config.content);
      }

      document.body.appendChild(this.element);

      // Animación de entrada
      requestAnimationFrame(() => {
        this.element.classList.add('modal-visible');
      });

      // Event listeners
      if (this.config.closable) {
        this.element.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
          if (e.target === this.element) this.close();
        });
      }

      // ESC key
      this._escHandler = (e) => {
        if (e.key === 'Escape' && this.config.closable) this.close();
      };
      document.addEventListener('keydown', this._escHandler);

      return this;
    }

    close() {
      if (!this.element) return;
      this.element.classList.remove('modal-visible');
      this.element.classList.add('modal-hiding');
      setTimeout(() => {
        this.element?.remove();
        this.element = null;
        document.removeEventListener('keydown', this._escHandler);
        if (this.config.onClose) this.config.onClose();
      }, 300);
    }

    getBody() {
      return this.element?.querySelector('.modal-body');
    }

    getFooter() {
      return this.element?.querySelector('.modal-footer');
    }

    setContent(html) {
      const body = this.getBody();
      if (body) body.innerHTML = html;
    }

    static confirm(message, title = 'Confirmar') {
      return new Promise((resolve) => {
        const modal = new Modal({
          title,
          size: 'sm',
          content: `<p style="margin: 0">${message}</p>`,
          footer: `
            <button class="btn btn-ghost modal-cancel-btn">Cancelar</button>
            <button class="btn btn-danger modal-confirm-btn">Confirmar</button>
          `,
          closable: true,
          onClose: () => resolve(false)
        });
        modal.open();
        modal.element.querySelector('.modal-cancel-btn').addEventListener('click', () => {
          modal.close();
          resolve(false);
        });
        modal.element.querySelector('.modal-confirm-btn').addEventListener('click', () => {
          modal.close();
          resolve(true);
        });
      });
    }
  }


  /* ═══════════════════════════════════════════
   * TOAST — Notificaciones flotantes
   * ═══════════════════════════════════════════ */
  const Toast = {
    _container: null,

    _getContainer() {
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);
      }
      return this._container;
    },

    show(message, type = 'info', duration = 4000) {
      const container = this._getContainer();
      const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">×</button>
      `;

      container.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('toast-visible'));

      const remove = () => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
      };

      toast.querySelector('.toast-close').addEventListener('click', remove);

      if (duration > 0) {
        setTimeout(remove, duration);
      }

      return { remove };
    },

    success(msg, d) { return this.show(msg, 'success', d); },
    error(msg, d) { return this.show(msg, 'error', d); },
    warning(msg, d) { return this.show(msg, 'warning', d); },
    info(msg, d) { return this.show(msg, 'info', d); }
  };


  /* ═══════════════════════════════════════════
   * KPI CARD — Tarjeta de indicador
   * ═══════════════════════════════════════════ */
  function KPICard({ id, title, value, unit, icon, trend, trendValue, color, subtitle }) {
    const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral';
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    
    return `
      <div class="kpi-card" id="${id || ''}" style="--kpi-color: ${color || 'var(--primary)'}">
        <div class="kpi-header">
          <span class="kpi-icon">${icon || ''}</span>
          <span class="kpi-trend ${trendClass}">
            ${trendIcon} ${trendValue || ''}
          </span>
        </div>
        <div class="kpi-value">${value}<span class="kpi-unit">${unit || ''}</span></div>
        <div class="kpi-title">${title}</div>
        ${subtitle ? `<div class="kpi-subtitle">${subtitle}</div>` : ''}
      </div>
    `;
  }


  /* ═══════════════════════════════════════════
   * STATUS BADGE — Etiqueta de estado
   * ═══════════════════════════════════════════ */
  function StatusBadge(status, map = {}) {
    const defaults = {
      'operando': { label: 'Operando', class: 'badge-success' },
      'en_falla': { label: 'En Falla', class: 'badge-danger' },
      'mantenimiento': { label: 'En Mtto', class: 'badge-warning' },
      'fuera_servicio': { label: 'Fuera de Servicio', class: 'badge-neutral' },
      'solicitada': { label: 'Solicitada', class: 'badge-info' },
      'aprobada': { label: 'Aprobada', class: 'badge-primary' },
      'planificada': { label: 'Planificada', class: 'badge-accent' },
      'en_ejecucion': { label: 'En Ejecución', class: 'badge-warning' },
      'completada': { label: 'Completada', class: 'badge-success' },
      'cerrada': { label: 'Cerrada', class: 'badge-neutral' },
      'cancelada': { label: 'Cancelada', class: 'badge-danger' },
      'critica': { label: 'Crítica', class: 'badge-danger' },
      'alta': { label: 'Alta', class: 'badge-warning' },
      'media': { label: 'Media', class: 'badge-info' },
      'baja': { label: 'Baja', class: 'badge-neutral' },
      'A': { label: 'Crítico (A)', class: 'badge-danger' },
      'B': { label: 'Importante (B)', class: 'badge-warning' },
      'C': { label: 'General (C)', class: 'badge-neutral' },
      'activo': { label: 'Activo', class: 'badge-success' },
      'inactivo': { label: 'Inactivo', class: 'badge-neutral' },
      'preventivo': { label: 'Preventivo', class: 'badge-primary' },
      'correctivo': { label: 'Correctivo', class: 'badge-danger' },
      'predictivo': { label: 'Predictivo', class: 'badge-accent' },
      'mejora': { label: 'Mejora', class: 'badge-success' },
    };

    const merged = { ...defaults, ...map };
    const cfg = merged[status] || { label: status, class: 'badge-neutral' };
    return `<span class="badge ${cfg.class}">${cfg.label}</span>`;
  }


  /* ═══════════════════════════════════════════
   * PROGRESS BAR
   * ═══════════════════════════════════════════ */
  function ProgressBar(value, max = 100, color) {
    const pct = Math.min(Math.round((value / max) * 100), 100);
    const autoColor = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--primary)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    return `
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${color || autoColor}"></div>
        <span class="progress-label">${pct}%</span>
      </div>
    `;
  }


  /* ═══════════════════════════════════════════
   * CHART WRAPPER — Helper para Chart.js
   * ═══════════════════════════════════════════ */
  const Charts = {
    instances: {},

    create(canvasId, config) {
      // Destruir instancia anterior si existe
      if (this.instances[canvasId]) {
        this.instances[canvasId].destroy();
      }

      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn(`[Charts] Canvas no encontrado: ${canvasId}`);
        return null;
      }

      // Tema oscuro para Chart.js
      const isDark = Store.get('theme') === 'dark';
      const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

      const defaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "'Inter', sans-serif", size: 12 }, padding: 16 }
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#f1f5f9' : '#1e293b',
            bodyColor: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: { family: "'Inter', sans-serif", weight: '600' },
            bodyFont: { family: "'Inter', sans-serif" }
          }
        },
        scales: {}
      };

      // Aplicar defaults al eje si existen
      if (config.type !== 'doughnut' && config.type !== 'pie' && config.type !== 'radar') {
        defaults.scales = {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        };
      }

      // Merge profundo de opciones
      const mergedOptions = this._deepMerge(defaults, config.options || {});

      const chart = new Chart(canvas, {
        type: config.type,
        data: config.data,
        options: mergedOptions,
        plugins: config.plugins || []
      });

      this.instances[canvasId] = chart;
      return chart;
    },

    update(canvasId, data) {
      const chart = this.instances[canvasId];
      if (chart) {
        chart.data = data;
        chart.update('none');
      }
    },

    destroy(canvasId) {
      if (this.instances[canvasId]) {
        this.instances[canvasId].destroy();
        delete this.instances[canvasId];
      }
    },

    destroyAll() {
      Object.keys(this.instances).forEach(id => this.destroy(id));
    },

    _deepMerge(target, source) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }
  };


  /* ═══════════════════════════════════════════
   * TAB SYSTEM
   * ═══════════════════════════════════════════ */
  function Tabs(containerId, tabs, defaultTab) {
    const active = defaultTab || tabs[0]?.id;
    return `
      <div class="tabs-wrapper" id="${containerId}">
        <div class="tabs-nav">
          ${tabs.map(t => `
            <button class="tab-btn ${t.id === active ? 'active' : ''}" data-tab="${t.id}">
              ${t.icon || ''} ${t.label}
              ${t.count !== undefined ? `<span class="tab-count">${t.count}</span>` : ''}
            </button>
          `).join('')}
        </div>
        <div class="tabs-content">
          ${tabs.map(t => `
            <div class="tab-panel ${t.id === active ? 'active' : ''}" data-panel="${t.id}">
              ${t.content || ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function initTabs(containerId, onChange) {
    const wrapper = document.getElementById(containerId);
    if (!wrapper) return;
    wrapper.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        wrapper.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        wrapper.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        wrapper.querySelector(`[data-panel="${tabId}"]`)?.classList.add('active');
        if (onChange) onChange(tabId);
      });
    });
  }


  /* ═══════════════════════════════════════════
   * FORM BUILDER — Generador de formularios
   * ═══════════════════════════════════════════ */
  function FormField({ name, label, type = 'text', value = '', required = false, options = [], placeholder = '', disabled = false, help = '', className = '', rows = 4 }) {
    const id = `field-${name}`;
    const req = required ? 'required' : '';

    switch (type) {
      case 'select':
        return `
          <div class="form-group ${className}">
            <label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
            <select id="${id}" name="${name}" class="form-control" ${req} ${disabled ? 'disabled' : ''}>
              <option value="">— Seleccionar —</option>
              ${options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
            ${help ? `<span class="form-help">${help}</span>` : ''}
          </div>
        `;
      case 'textarea':
        return `
          <div class="form-group ${className}">
            <label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
            <textarea id="${id}" name="${name}" class="form-control" rows="${rows}" ${req} ${disabled ? 'disabled' : ''} placeholder="${placeholder}">${value}</textarea>
            ${help ? `<span class="form-help">${help}</span>` : ''}
          </div>
        `;
      case 'checkbox':
        return `
          <div class="form-group form-check ${className}">
            <input type="checkbox" id="${id}" name="${name}" class="form-check-input" ${value ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
            <label for="${id}" class="form-check-label">${label}</label>
          </div>
        `;
      case 'number':
        return `
          <div class="form-group ${className}">
            <label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
            <input type="number" id="${id}" name="${name}" class="form-control" value="${value}" ${req} ${disabled ? 'disabled' : ''} placeholder="${placeholder}" step="${options.step || 'any'}" min="${options.min ?? ''}" max="${options.max ?? ''}">
            ${help ? `<span class="form-help">${help}</span>` : ''}
          </div>
        `;
      case 'date':
      case 'datetime-local':
        return `
          <div class="form-group ${className}">
            <label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
            <input type="${type}" id="${id}" name="${name}" class="form-control" value="${value}" ${req} ${disabled ? 'disabled' : ''}>
            ${help ? `<span class="form-help">${help}</span>` : ''}
          </div>
        `;
      default:
        return `
          <div class="form-group ${className}">
            <label for="${id}" class="form-label">${label} ${required ? '<span class="required">*</span>' : ''}</label>
            <input type="${type}" id="${id}" name="${name}" class="form-control" value="${value}" ${req} ${disabled ? 'disabled' : ''} placeholder="${placeholder}">
            ${help ? `<span class="form-help">${help}</span>` : ''}
          </div>
        `;
    }
  }

  /**
   * Leer datos de un formulario
   */
  function readForm(formElement) {
    const data = {};
    const form = typeof formElement === 'string' ? document.getElementById(formElement) : formElement;
    if (!form) return data;

    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        data[el.name] = el.checked;
      } else if (el.type === 'number') {
        data[el.name] = el.value ? parseFloat(el.value) : null;
      } else {
        data[el.name] = el.value;
      }
    });

    return data;
  }

  /**
   * Validar formulario
   */
  function validateForm(formElement) {
    const form = typeof formElement === 'string' ? document.getElementById(formElement) : formElement;
    if (!form) return false;

    let valid = true;
    form.querySelectorAll('[required]').forEach(el => {
      if (!el.value || el.value.trim() === '') {
        el.classList.add('is-invalid');
        valid = false;
      } else {
        el.classList.remove('is-invalid');
      }
    });

    return valid;
  }


  /* ═══════════════════════════════════════════
   * EMPTY STATE
   * ═══════════════════════════════════════════ */
  function EmptyState({ icon, title, message, action }) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon || '📋'}</div>
        <h3 class="empty-state-title">${title || 'Sin datos'}</h3>
        <p class="empty-state-message">${message || 'No hay registros para mostrar'}</p>
        ${action ? `<button class="btn btn-primary" onclick="${action.onClick}">${action.label}</button>` : ''}
      </div>
    `;
  }


  /* ═══════════════════════════════════════════
   * LOADING SPINNER
   * ═══════════════════════════════════════════ */
  function Spinner(size = 'md', text = '') {
    return `
      <div class="loading-view">
        <div class="spinner spinner-${size}"></div>
        ${text ? `<p>${text}</p>` : ''}
      </div>
    `;
  }

  /* ═══════════════════════════════════════════
   * UTILITY: Format helpers
   * ═══════════════════════════════════════════ */
  const Format = {
    currency(val, currency = 'MXN') {
      if (val == null || isNaN(val)) return '$0.00';
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(val);
    },
    number(val, decimals = 0) {
      if (val == null || isNaN(val)) return '0';
      return new Intl.NumberFormat('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
    },
    date(val) {
      if (!val) return '—';
      return new Date(val).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    datetime(val) {
      if (!val) return '—';
      return new Date(val).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    relative(val) {
      if (!val) return '';
      const diff = Date.now() - new Date(val).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Ahora';
      if (mins < 60) return `Hace ${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Hace ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `Hace ${days}d`;
      return Format.date(val);
    },
    hours(mins) {
      if (!mins) return '0h';
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },
    percentage(val, decimals = 1) {
      if (val == null || isNaN(val)) return '0%';
      return `${Number(val).toFixed(decimals)}%`;
    }
  };


  return {
    DataTable,
    Modal,
    Toast,
    KPICard,
    StatusBadge,
    ProgressBar,
    Charts,
    Tabs,
    initTabs,
    FormField,
    readForm,
    validateForm,
    EmptyState,
    Spinner,
    Format
  };
})();
