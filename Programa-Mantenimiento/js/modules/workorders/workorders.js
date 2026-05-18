/**
 * CMMS Enterprise — Módulo de Órdenes de Trabajo
 * Gestión completa de OTs: Kanban, lista, detalle y formulario de creación
 */
const WorkOrdersModule = (() => {
  let currentView = 'kanban';
  const statusFlow = ['solicitada','aprobada','planificada','en_ejecucion','completada','cerrada'];
  const statusLabels = { solicitada:'Solicitada', aprobada:'Aprobada', planificada:'Planificada', en_ejecucion:'En Ejecución', completada:'Completada', cerrada:'Cerrada', cancelada:'Cancelada' };
  const statusColors = { solicitada:'var(--info)', aprobada:'var(--primary)', planificada:'var(--accent)', en_ejecucion:'var(--warning)', completada:'var(--success)', cerrada:'var(--text-muted)', cancelada:'var(--danger)' };

  async function render() {
    const wos = await CMMSDatabase.getAll('workorders');
    const total = wos.length;
    const pending = wos.filter(w => !['completada','cerrada','cancelada'].includes(w.status)).length;
    const overdue = wos.filter(w => !['completada','cerrada','cancelada'].includes(w.status) && w.scheduledDate && new Date(w.scheduledDate) < new Date()).length;
    const completedThisMonth = wos.filter(w => { const d=new Date(w.completedAt); const n=new Date(); return ['completada','cerrada'].includes(w.status) && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear(); }).length;
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Órdenes de Trabajo</h1>
          <p class="page-subtitle">Gestión completa del ciclo de vida de OTs — ${total} registradas</p>
        </div>
        <div class="page-actions">
          <div class="btn-group">
            <button class="btn btn-sm ${currentView==='kanban'?'btn-primary':'btn-ghost'}" onclick="WorkOrdersModule.setView('kanban')">Kanban</button>
            <button class="btn btn-sm ${currentView==='list'?'btn-primary':'btn-ghost'}" onclick="WorkOrdersModule.setView('list')">Lista</button>
          </div>
          <button class="btn btn-primary" onclick="Router.navigate('/workorders/new')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva OT
          </button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${Components.KPICard({title:'Total OTs',value:total,icon:'📋',color:'var(--primary)'})}
        ${Components.KPICard({title:'Pendientes',value:pending,icon:'⏳',color:pending>20?'var(--danger)':'var(--warning)',subtitle:`${overdue} vencidas`})}
        ${Components.KPICard({title:'Vencidas',value:overdue,icon:'⚠️',color:overdue>0?'var(--danger)':'var(--success)'})}
        ${Components.KPICard({title:'Completadas (mes)',value:completedThisMonth,icon:'✅',color:'var(--success)'})}
      </div>
      <div id="wo-content-area"></div>
    `;
  }

  async function afterRender() { currentView==='kanban' ? await renderKanban() : await renderList(); }

  async function renderKanban() {
    const wos = await CMMSDatabase.getAll('workorders');
    const c = document.getElementById('wo-content-area'); if(!c) return;
    const columns = [
      {status:'solicitada',icon:'📥',color:'var(--info)'},
      {status:'aprobada',icon:'✔️',color:'var(--primary)'},
      {status:'planificada',icon:'📅',color:'var(--accent)'},
      {status:'en_ejecucion',icon:'🔧',color:'var(--warning)'},
      {status:'completada',icon:'✅',color:'var(--success)'},
    ];
    c.innerHTML = `<div class="kanban-board">${columns.map(col => {
      const items = wos.filter(w => w.status===col.status).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      return `<div class="kanban-column">
        <div class="kanban-column-header">
          <div class="kanban-column-title"><span>${col.icon}</span> ${statusLabels[col.status]}</div>
          <span class="kanban-column-count">${items.length}</span>
        </div>
        <div class="kanban-column-body">${items.length===0?'<div class="kanban-empty">Sin OTs</div>':items.slice(0,20).map(wo=>`
          <div class="kanban-card priority-${wo.priority}" onclick="Router.navigate('/workorders/${wo.id}')">
            <div class="kanban-card-folio">${wo.folio}</div>
            <div class="kanban-card-title">${(wo.title||wo.description||'').substring(0,60)}</div>
            <div class="kanban-card-meta">
              <span class="kanban-card-tag">${wo.assetTag}</span>
              <span>${Components.StatusBadge(wo.type)}</span>
            </div>
            <div class="kanban-card-meta">
              <span>${Components.StatusBadge(wo.priority)}</span>
              <span>${Components.Format.relative(wo.createdAt)}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  async function renderList() {
    const wos = await CMMSDatabase.getAll('workorders');
    const c = document.getElementById('wo-content-area'); if(!c) return;
    c.innerHTML = '<div class="card"><div class="card-body" style="padding:0"><div id="wo-datatable"></div></div></div>';
    const dt = new Components.DataTable('wo-datatable',{
      data: wos.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),
      pageSize:20, searchable:true, exportable:true,
      onRowClick: r => Router.navigate(`/workorders/${r.id}`),
      columns:[
        {key:'folio',label:'Folio',width:'110px',render:v=>`<strong style="color:var(--primary);font-family:var(--font-mono);font-size:var(--fs-xs)">${v}</strong>`},
        {key:'assetTag',label:'Equipo',width:'100px',render:(v,r)=>`<span title="${r.assetName}" style="font-family:var(--font-mono);font-size:var(--fs-xs)">${v}</span>`},
        {key:'title',label:'Descripción',render:(v)=>`<span class="truncate" style="max-width:220px;display:inline-block">${(v||'').substring(0,50)}</span>`},
        {key:'type',label:'Tipo',width:'100px',align:'center',render:v=>Components.StatusBadge(v)},
        {key:'priority',label:'Prioridad',width:'95px',align:'center',render:v=>Components.StatusBadge(v)},
        {key:'status',label:'Estado',width:'115px',align:'center',render:v=>Components.StatusBadge(v)},
        {key:'createdAt',label:'Fecha',width:'90px',render:v=>`<span style="font-size:var(--fs-xs)">${Components.Format.date(v)}</span>`}
      ],
      rowClass: r => r.status==='en_ejecucion'?'row-warning': (r.scheduledDate && new Date(r.scheduledDate)<new Date() && !['completada','cerrada','cancelada'].includes(r.status))?'row-danger':''
    });
    dt.render();
  }

  async function renderDetail(woId) {
    const wo = await CMMSDatabase.getById('workorders',woId);
    if(!wo) return `<div class="page-header"><div><h1 class="page-title">OT No Encontrada</h1></div></div><div class="card" style="max-width:500px;margin:var(--space-8) auto"><div class="card-body" style="text-align:center;padding:var(--space-10)"><p style="color:var(--text-secondary)">La orden de trabajo no existe.</p><button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="Router.navigate('/workorders')">Volver</button></div></div>`;
    const users = await CMMSDatabase.getAll('users');
    const assignee = users.find(u=>u.id===wo.assignedTo);
    const requester = users.find(u=>u.id===wo.requestedBy);
    const flowHTML = statusFlow.map((s,i) => {
      const idx = statusFlow.indexOf(wo.status);
      const cls = i<idx?'completed':i===idx?'active':'';
      return `${i>0?'<span class="wo-flow-arrow">→</span>':''}<div class="wo-flow-step ${cls}">${statusLabels[s]}</div>`;
    }).join('');
    return `
      <div class="page-header">
        <div>
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/workorders')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> OTs</button>
            <span style="color:var(--text-muted)">›</span>
            <span style="font-family:var(--font-mono);color:var(--primary);font-weight:600">${wo.folio}</span>
          </div>
          <h1 class="page-title">${wo.title||wo.folio}</h1>
          <p class="page-subtitle">${wo.assetTag} — ${wo.assetName} — ${wo.area}</p>
        </div>
        <div class="page-actions">
          ${wo.status!=='cerrada'&&wo.status!=='cancelada'?`<button class="btn btn-success" onclick="WorkOrdersModule.advanceStatus('${wo.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            Avanzar Estado
          </button>`:''}
        </div>
      </div>
      <div class="card mb-4"><div class="card-body"><div class="wo-flow">${flowHTML}</div></div></div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-4)">
        <div>
          <div class="card mb-4"><div class="card-header"><h3 class="card-title">Descripción</h3></div><div class="card-body"><p style="color:var(--text-secondary);line-height:1.7">${wo.description||'Sin descripción'}</p>
          ${wo.failureMode?`<div style="margin-top:var(--space-3)"><strong style="color:var(--text-primary)">Modo de Falla:</strong> <span style="color:var(--text-secondary)">${wo.failureMode}</span></div>`:''} 
          ${wo.rootCause?`<div style="margin-top:var(--space-2)"><strong style="color:var(--text-primary)">Causa Raíz:</strong> <span style="color:var(--text-secondary)">${wo.rootCause}</span></div>`:''}</div></div>
          ${wo.notes?`<div class="card mb-4"><div class="card-header"><h3 class="card-title">Notas</h3></div><div class="card-body"><p style="color:var(--text-secondary)">${wo.notes}</p></div></div>`:''}
        </div>
        <div>
          <div class="card mb-4"><div class="card-header"><h3 class="card-title">Detalles</h3></div><div class="card-body">
            <table class="detail-table">
              <tr><td class="detail-label">Tipo</td><td class="detail-value">${Components.StatusBadge(wo.type)}</td></tr>
              <tr><td class="detail-label">Prioridad</td><td class="detail-value">${Components.StatusBadge(wo.priority)}</td></tr>
              <tr><td class="detail-label">Estado</td><td class="detail-value">${Components.StatusBadge(wo.status)}</td></tr>
              <tr><td class="detail-label">Asignado a</td><td class="detail-value">${assignee?assignee.name:'—'}</td></tr>
              <tr><td class="detail-label">Solicitado por</td><td class="detail-value">${requester?requester.name:'—'}</td></tr>
              <tr><td class="detail-label">Creada</td><td class="detail-value">${Components.Format.datetime(wo.createdAt)}</td></tr>
              <tr><td class="detail-label">Programada</td><td class="detail-value">${Components.Format.date(wo.scheduledDate)}</td></tr>
              <tr><td class="detail-label">Hrs Estimadas</td><td class="detail-value">${wo.estimatedHours||'—'}h</td></tr>
              <tr><td class="detail-label">Hrs Reales</td><td class="detail-value">${wo.actualHours?wo.actualHours+'h':'—'}</td></tr>
              <tr><td class="detail-label">Costo Material</td><td class="detail-value">${Components.Format.currency(wo.materialCost||0)}</td></tr>
              <tr><td class="detail-label">Costo M.O.</td><td class="detail-value">${Components.Format.currency(wo.laborCost||0)}</td></tr>
              <tr><td class="detail-label"><strong>Costo Total</strong></td><td class="detail-value"><strong>${Components.Format.currency((wo.materialCost||0)+(wo.laborCost||0))}</strong></td></tr>
            </table>
          </div></div>
          ${wo.safetyChecklist?`<div class="card"><div class="card-header"><h3 class="card-title">🛡️ Seguridad</h3></div><div class="card-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-2)">
              <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--fs-sm);color:var(--text-secondary)"><input type="checkbox" ${wo.safetyChecklist.loto?'checked':''} disabled> LOTO aplicado</label>
              <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--fs-sm);color:var(--text-secondary)"><input type="checkbox" ${wo.safetyChecklist.ppe?'checked':''} disabled> EPP verificado</label>
              <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--fs-sm);color:var(--text-secondary)"><input type="checkbox" ${wo.safetyChecklist.permit?'checked':''} disabled> Permiso de trabajo</label>
            </div>
          </div></div>`:''}
        </div>
      </div>`;
  }
  function afterRenderDetail(){}

  async function renderNew() {
    const assets = await CMMSDatabase.getAll('assets');
    const users = await CMMSDatabase.getAll('users');
    const techs = users.filter(u => ['technician','engineer'].includes(u.role));
    return `
      <div class="page-header"><div>
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/workorders')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> OTs</button>
        </div>
        <h1 class="page-title">Nueva Orden de Trabajo</h1>
        <p class="page-subtitle">Complete el formulario para crear una nueva OT</p>
      </div></div>
      <div class="card"><div class="card-body" style="padding:var(--space-6)">
        <form id="new-wo-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
            ${Components.FormField({name:'assetId',label:'Equipo',type:'select',required:true,options:assets.map(a=>({value:a.id,label:`${a.tag} — ${a.name}`}))})}
            ${Components.FormField({name:'type',label:'Tipo de Mtto.',type:'select',required:true,options:[{value:'correctivo',label:'Correctivo'},{value:'preventivo',label:'Preventivo'},{value:'predictivo',label:'Predictivo'},{value:'mejora',label:'Mejora'}]})}
            ${Components.FormField({name:'priority',label:'Prioridad',type:'select',required:true,options:[{value:'critica',label:'Crítica'},{value:'alta',label:'Alta'},{value:'media',label:'Media'},{value:'baja',label:'Baja'}]})}
            ${Components.FormField({name:'assignedTo',label:'Asignar a',type:'select',required:true,options:techs.map(t=>({value:t.id,label:`${t.name} (${t.position})`}))})}
            ${Components.FormField({name:'title',label:'Título / Descripción corta',required:true,placeholder:'Ej: Falla en sistema hidráulico',className:'span-2'})}
            ${Components.FormField({name:'description',label:'Descripción detallada',type:'textarea',className:'span-2',placeholder:'Describa el trabajo a realizar, síntomas observados, etc.'})}
            ${Components.FormField({name:'scheduledDate',label:'Fecha programada',type:'date'})}
            ${Components.FormField({name:'estimatedHours',label:'Horas estimadas',type:'number',options:{min:0.5,step:0.5}})}
            ${Components.FormField({name:'failureMode',label:'Modo de falla',placeholder:'Ej: Fuga de aceite, vibración excesiva'})}
            ${Components.FormField({name:'status',label:'Estado inicial',type:'select',value:'solicitada',options:[{value:'solicitada',label:'Solicitada'},{value:'aprobada',label:'Aprobada'},{value:'planificada',label:'Planificada'}]})}
          </div>
          <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-6)">
            <button type="button" class="btn btn-ghost" onclick="Router.navigate('/workorders')">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="WorkOrdersModule.saveNew()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
              Crear OT
            </button>
          </div>
        </form>
      </div></div>`;
  }
  function afterRenderNew(){}

  async function saveNew() {
    const form = document.getElementById('new-wo-form');
    if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos obligatorios');return;}
    const data = Components.readForm(form);
    const asset = await CMMSDatabase.getById('assets',data.assetId);
    if(asset){data.assetTag=asset.tag;data.assetName=asset.name;data.area=asset.area;}
    const count = await CMMSDatabase.count('workorders');
    data.folio = `OT-${String(2024000+count+1)}`;
    data.requestedBy = Store.get('currentUser')?.id || 'usr_001';
    data.materialCost=0; data.laborCost=0; data.actualHours=null;
    data.safetyChecklist={loto:null,ppe:null,permit:false};
    try{
      await CMMSDatabase.create('workorders',data);
      Components.Toast.success(`OT ${data.folio} creada exitosamente`);
      Router.navigate('/workorders');
    }catch(e){Components.Toast.error('Error: '+e.message);}
  }

  async function advanceStatus(woId) {
    const wo = await CMMSDatabase.getById('workorders',woId); if(!wo) return;
    const idx = statusFlow.indexOf(wo.status);
    if(idx<0||idx>=statusFlow.length-1){Components.Toast.warning('No se puede avanzar más el estado');return;}
    const newStatus = statusFlow[idx+1];
    if(newStatus==='completada'){wo.completedAt=new Date().toISOString();wo.actualHours=wo.estimatedHours;}
    wo.status=newStatus;
    if(newStatus==='en_ejecucion')wo.startedAt=new Date().toISOString();
    await CMMSDatabase.update('workorders',wo);
    Components.Toast.success(`OT ${wo.folio} → ${statusLabels[newStatus]}`);
    Router.resolve();
  }

  function setView(v){currentView=v;refreshView();}
  async function refreshView(){const mc=document.getElementById('main-content');mc.innerHTML=await render();await afterRender();}
  return {render,afterRender,renderDetail,afterRenderDetail,renderNew,afterRenderNew,saveNew,advanceStatus,setView,refreshView};
})();
