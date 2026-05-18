/**
 * CMMS Enterprise — Módulo de Administración
 * Usuarios, roles, catálogos, configuración y auditoría
 */
const AdminModule = (() => {
  let currentTab = 'users';

  async function render() {
    const users = await CMMSDatabase.getAll('users');
    const catalogs = await CMMSDatabase.getAll('catalogs');
    const assets = await CMMSDatabase.getAll('assets');
    const wos = await CMMSDatabase.getAll('workorders');

    const tabs = [
      {id:'users',label:'👥 Usuarios',count:users.length},
      {id:'catalogs',label:'📂 Catálogos',count:catalogs.length},
      {id:'config',label:'⚙️ Configuración'},
      {id:'data',label:'💾 Datos',desc:'Importar/Exportar'},
      {id:'audit',label:'📝 Auditoría'}
    ];

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Administración del Sistema</h1>
          <p class="page-subtitle">Usuarios, catálogos, configuración y herramientas de administración</p>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        ${Components.KPICard({title:'Usuarios',value:users.length,icon:'👥',color:'var(--primary)'})}
        ${Components.KPICard({title:'Activos',value:assets.length,icon:'🏭',color:'var(--info)'})}
        ${Components.KPICard({title:'OTs',value:wos.length,icon:'📋',color:'var(--warning)'})}
        ${Components.KPICard({title:'Catálogos',value:catalogs.length,icon:'📂',color:'var(--accent)'})}
      </div>
      <div class="card">
        <div class="card-header" style="border-bottom:1px solid var(--border-color)">
          <div style="display:flex;gap:var(--space-1)">
            ${tabs.map(t=>`<button class="btn btn-sm ${currentTab===t.id?'btn-primary':'btn-ghost'}" onclick="AdminModule.setTab('${t.id}')">${t.label}${t.count?` (${t.count})`:''}</button>`).join('')}
          </div>
        </div>
        <div class="card-body" id="admin-content" style="padding:var(--space-4)"></div>
      </div>
    `;
  }

  async function afterRender() { await renderTab(currentTab); }

  function setTab(tab) { currentTab=tab; renderTab(tab); }

  async function renderTab(tab) {
    const c = document.getElementById('admin-content'); if(!c) return;
    switch(tab) {
      case 'users': await renderUsers(c); break;
      case 'catalogs': await renderCatalogs(c); break;
      case 'config': renderConfig(c); break;
      case 'data': renderData(c); break;
      case 'audit': renderAudit(c); break;
    }
  }

  async function renderUsers(c) {
    const users = await CMMSDatabase.getAll('users');
    const roleLabels = {admin:'Administrador',planner:'Planeador',technician:'Técnico',supervisor:'Supervisor',warehouse:'Almacén',engineer:'Ingeniero'};
    const roleColors = {admin:'badge-danger',planner:'badge-primary',technician:'badge-success',supervisor:'badge-warning',warehouse:'badge-neutral',engineer:'badge-info'};

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
        <h3 style="color:var(--text-primary)">Gestión de Usuarios</h3>
        <button class="btn btn-sm btn-primary" onclick="AdminModule.addUser()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Usuario
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-3)">
        ${users.map(u=>`
          <div class="card" style="border-left:3px solid ${u.active?'var(--success)':'var(--text-muted)'}">
            <div class="card-body" style="padding:var(--space-3)">
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <div style="width:40px;height:40px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:var(--fs-sm);flex-shrink:0">${u.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;color:var(--text-primary)">${u.name}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted)">${u.position}</div>
                  <div style="display:flex;gap:var(--space-2);margin-top:var(--space-1);flex-wrap:wrap">
                    <span class="badge ${roleColors[u.role]||'badge-neutral'}" style="font-size:10px">${roleLabels[u.role]||u.role}</span>
                    <span class="badge badge-neutral" style="font-size:10px">${u.area}</span>
                    ${u.active?'':'<span class="badge badge-danger" style="font-size:10px">Inactivo</span>'}
                  </div>
                </div>
              </div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--space-2)">
                📧 ${u.email}<br>
                🔑 <code style="font-size:10px">${u.username}</code>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function renderCatalogs(c) {
    const catalogs = await CMMSDatabase.getAll('catalogs');
    const types = [...new Set(catalogs.map(cat=>cat.type))];
    const typeLabels = {area:'Áreas',failure_type:'Tipos de Falla',root_cause:'Causas Raíz'};

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
        <h3 style="color:var(--text-primary)">Catálogos del Sistema</h3>
      </div>
      ${types.map(type=>{
        const items = catalogs.filter(cat=>cat.type===type);
        return `<div style="margin-bottom:var(--space-4)">
          <h4 style="color:var(--text-secondary);margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-2)">
            <span class="badge badge-primary" style="font-size:var(--fs-xs)">${items.length}</span>
            ${typeLabels[type]||type}
          </h4>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
            ${items.map(item=>`
              <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--fs-sm)">
                <code style="font-size:var(--fs-xs);color:var(--primary)">${item.code}</code>
                <span style="color:var(--text-primary)">${item.name}</span>
                ${item.active?'':'<span class="badge badge-danger" style="font-size:9px">Inactivo</span>'}
              </div>
            `).join('')}
          </div>
        </div>`;
      }).join('')}
    `;
  }

  function renderConfig(c) {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    c.innerHTML = `
      <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">Configuración General</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div class="detail-section">
          <h4 class="detail-section-title">🎨 Apariencia</h4>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--fs-sm)">Tema</span>
              <button class="btn btn-sm btn-ghost" onclick="App.toggleTheme()">${theme==='dark'?'🌙 Oscuro':'☀️ Claro'} — Cambiar</button>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">🏭 Empresa</h4>
          <table class="detail-table">
            <tr><td class="detail-label">Nombre</td><td class="detail-value">Manufactura Automotriz S.A.</td></tr>
            <tr><td class="detail-label">Planta</td><td class="detail-value">Planta Principal</td></tr>
            <tr><td class="detail-label">Moneda</td><td class="detail-value">MXN (Peso Mexicano)</td></tr>
            <tr><td class="detail-label">Zona horaria</td><td class="detail-value">UTC-6 (CST)</td></tr>
          </table>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">🔧 Mantenimiento</h4>
          <table class="detail-table">
            <tr><td class="detail-label">Costo hora técnico</td><td class="detail-value">$350 MXN</td></tr>
            <tr><td class="detail-label">Jornada laboral</td><td class="detail-value">8 horas</td></tr>
            <tr><td class="detail-label">Días laborales</td><td class="detail-value">Lunes a Sábado</td></tr>
            <tr><td class="detail-label">Meta MTBF</td><td class="detail-value">≥ 200 hrs</td></tr>
            <tr><td class="detail-label">Meta MTTR</td><td class="detail-value">≤ 4 hrs</td></tr>
            <tr><td class="detail-label">Meta Cumplimiento PM</td><td class="detail-value">≥ 90%</td></tr>
          </table>
        </div>
        <div class="detail-section">
          <h4 class="detail-section-title">📊 Base de Datos</h4>
          <table class="detail-table" id="db-stats">
            <tr><td class="detail-label">Motor</td><td class="detail-value">IndexedDB (Local)</td></tr>
            <tr><td class="detail-label">Estado</td><td class="detail-value"><span class="badge badge-success">Conectada</span></td></tr>
          </table>
          <button class="btn btn-sm btn-ghost" style="margin-top:var(--space-3)" onclick="AdminModule.loadDBStats()">Actualizar Estadísticas</button>
        </div>
      </div>
    `;
  }

  function renderData(c) {
    c.innerHTML = `
      <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">Gestión de Datos</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div class="detail-section" style="text-align:center">
          <h4 class="detail-section-title" style="justify-content:center">📤 Exportar Datos</h4>
          <p style="font-size:var(--fs-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Descargue todos los datos del sistema en formato JSON para respaldo o migración.</p>
          <button class="btn btn-primary" onclick="AdminModule.exportAllData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar Todo (JSON)
          </button>
        </div>
        <div class="detail-section" style="text-align:center">
          <h4 class="detail-section-title" style="justify-content:center">🔄 Reiniciar Datos</h4>
          <p style="font-size:var(--fs-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Elimine toda la base de datos y reinicie con los datos de demostración.</p>
          <button class="btn btn-danger" onclick="AdminModule.resetData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Reiniciar BD
          </button>
        </div>
      </div>
    `;
  }

  function renderAudit(c) {
    const logs = [
      {date:new Date().toISOString(),user:'Carlos Mendoza',action:'Inicio de sesión',module:'Sistema'},
      {date:new Date(Date.now()-3600000).toISOString(),user:'Juan Ramírez',action:'Creó OT OT-2024215',module:'Órdenes de Trabajo'},
      {date:new Date(Date.now()-7200000).toISOString(),user:'Miguel López',action:'Completó OT OT-2024210',module:'Órdenes de Trabajo'},
      {date:new Date(Date.now()-14400000).toISOString(),user:'Patricia Castillo',action:'Salida de inventario: 5 pzs ROD-6205-2RS',module:'Inventario'},
      {date:new Date(Date.now()-28800000).toISOString(),user:'Karen Valencia',action:'Nuevo análisis AMEF para EST-PH-001',module:'AMEF'},
      {date:new Date(Date.now()-36000000).toISOString(),user:'Ana Herrera',action:'Ejecutó MP Trimestral Robot FANUC #1',module:'Preventivo'},
      {date:new Date(Date.now()-43200000).toISOString(),user:'Carlos Mendoza',action:'Exportación de datos del sistema',module:'Administración'},
      {date:new Date(Date.now()-86400000).toISOString(),user:'Fernando Morales',action:'Actualizó estado de EST-PH-002 a operando',module:'Activos'},
    ];

    c.innerHTML = `
      <h3 style="color:var(--text-primary);margin-bottom:var(--space-4)">Log de Auditoría</h3>
      <table class="datatable" style="width:100%"><thead><tr>
        <th>Fecha/Hora</th><th>Usuario</th><th>Acción</th><th>Módulo</th>
      </tr></thead><tbody>
        ${logs.map(l=>`<tr>
          <td style="font-size:var(--fs-xs);font-family:var(--font-mono)">${Components.Format.datetime(l.date)}</td>
          <td style="font-size:var(--fs-sm)">${l.user}</td>
          <td style="font-size:var(--fs-sm)">${l.action}</td>
          <td><span class="badge badge-neutral" style="font-size:var(--fs-xs)">${l.module}</span></td>
        </tr>`).join('')}
      </tbody></table>
    `;
  }

  async function addUser() {
    const modal = new Components.Modal({
      title:'👤 Nuevo Usuario',size:'md',
      content:`<form id="new-user-form"><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${Components.FormField({name:'name',label:'Nombre completo',required:true})}
        ${Components.FormField({name:'username',label:'Usuario',required:true})}
        ${Components.FormField({name:'email',label:'Email',required:true})}
        ${Components.FormField({name:'password',label:'Contraseña',required:true,value:'1234'})}
        ${Components.FormField({name:'role',label:'Rol',type:'select',required:true,options:[{value:'admin',label:'Administrador'},{value:'planner',label:'Planeador'},{value:'technician',label:'Técnico'},{value:'supervisor',label:'Supervisor'},{value:'warehouse',label:'Almacén'},{value:'engineer',label:'Ingeniero'}]})}
        ${Components.FormField({name:'area',label:'Área',type:'select',required:true,options:['Mantenimiento','Producción','Almacén','Calidad','Ingeniería'].map(a=>({value:a,label:a}))})}
        ${Components.FormField({name:'position',label:'Puesto',required:true,className:'span-2'})}
      </div></form>`,
      footer:`<button class="btn btn-ghost modal-cancel-btn">Cancelar</button><button class="btn btn-primary modal-save-btn">Crear Usuario</button>`
    });
    modal.open();
    modal.element.querySelector('.modal-cancel-btn').addEventListener('click',()=>modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click',async()=>{
      const form=document.getElementById('new-user-form');
      if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos');return;}
      const data=Components.readForm(form); data.active=true;
      await CMMSDatabase.create('users',data);
      Components.Toast.success(`Usuario ${data.username} creado`);
      modal.close(); await renderTab('users');
    });
  }

  async function exportAllData() {
    try {
      const stores = ['users','assets','workorders','inventory','preventive_plans','amef','catalogs'];
      const data = {};
      for(const store of stores) {
        data[store] = await CMMSDatabase.getAll(store);
      }
      data.exportDate = new Date().toISOString();
      data.version = '1.0';
      const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=`cmms_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      Components.Toast.success('Datos exportados exitosamente');
    } catch(e) { Components.Toast.error('Error al exportar: '+e.message); }
  }

  async function resetData() {
    const confirmed = await Components.Modal.confirm(
      '⚠️ ¿Está seguro de reiniciar toda la base de datos? Se eliminarán TODOS los datos y se cargarán los datos de demostración. Esta acción NO se puede deshacer.',
      'Reiniciar Base de Datos'
    );
    if(confirmed) {
      try {
        await CMMSDatabase.clearAll();
        await SeedData.seed();
        Components.Toast.success('Base de datos reiniciada con datos de demostración');
        setTimeout(()=>window.location.reload(),1000);
      } catch(e) { Components.Toast.error('Error: '+e.message); }
    }
  }

  async function loadDBStats() {
    const stores = ['users','assets','workorders','inventory','preventive_plans','amef','catalogs'];
    const stats = {};
    for(const store of stores) { try{stats[store]=await CMMSDatabase.count(store);}catch(e){stats[store]=0;} }
    const table = document.getElementById('db-stats');
    if(table) {
      let rows = '<tr><td class="detail-label">Motor</td><td class="detail-value">IndexedDB (Local)</td></tr>';
      rows += '<tr><td class="detail-label">Estado</td><td class="detail-value"><span class="badge badge-success">Conectada</span></td></tr>';
      for(const [store,count] of Object.entries(stats)) {
        rows += `<tr><td class="detail-label">${store}</td><td class="detail-value"><strong>${count}</strong> registros</td></tr>`;
      }
      table.innerHTML = rows;
    }
    Components.Toast.info('Estadísticas actualizadas');
  }

  return {render,afterRender,setTab,addUser,exportAllData,resetData,loadDBStats};
})();
