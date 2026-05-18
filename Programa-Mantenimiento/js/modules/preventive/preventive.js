/**
 * CMMS Enterprise — Módulo de Mantenimiento Preventivo
 * Planes, calendario, rutas de inspección y generación automática de OTs
 */
const PreventiveModule = (() => {
  let currentView = 'plans';

  async function render() {
    const plans = await CMMSDatabase.getAll('preventive_plans');
    const active = plans.filter(p => p.status === 'activo').length;
    const today = new Date();
    const dueToday = plans.filter(p => { if(!p.nextDueDate) return false; const d=new Date(p.nextDueDate); return d.toDateString()===today.toDateString(); }).length;
    const overdue = plans.filter(p => { if(!p.nextDueDate) return false; return new Date(p.nextDueDate)<today && p.status==='activo'; }).length;
    const avgCompliance = active>0 ? plans.filter(p=>p.status==='activo').reduce((s,p)=>s+(p.compliance||0),0)/active : 0;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Mantenimiento Preventivo</h1>
          <p class="page-subtitle">Planes de mantenimiento, calendario y rutas de inspección</p>
        </div>
        <div class="page-actions">
          <div class="btn-group">
            <button class="btn btn-sm ${currentView==='plans'?'btn-primary':'btn-ghost'}" onclick="PreventiveModule.setView('plans')">📋 Planes</button>
            <button class="btn btn-sm ${currentView==='calendar'?'btn-primary':'btn-ghost'}" onclick="PreventiveModule.setView('calendar')">📅 Calendario</button>
          </div>
          <button class="btn btn-primary" onclick="PreventiveModule.createPlan()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Plan
          </button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${Components.KPICard({title:'Planes Activos',value:active,icon:'📋',color:'var(--primary)'})}
        ${Components.KPICard({title:'Vencen Hoy',value:dueToday,icon:'📅',color:dueToday>0?'var(--warning)':'var(--success)'})}
        ${Components.KPICard({title:'Vencidos',value:overdue,icon:'⚠️',color:overdue>0?'var(--danger)':'var(--success)'})}
        ${Components.KPICard({title:'Cumplimiento',value:avgCompliance.toFixed(0),unit:'%',icon:'✅',color:avgCompliance>=90?'var(--success)':avgCompliance>=75?'var(--warning)':'var(--danger)'})}
      </div>
      <div id="preventive-content"></div>
    `;
  }

  async function afterRender() { currentView==='plans' ? await renderPlans() : await renderCalendar(); }

  async function renderPlans() {
    const plans = await CMMSDatabase.getAll('preventive_plans');
    const c = document.getElementById('preventive-content'); if(!c) return;
    const sorted = plans.sort((a,b) => {
      if(!a.nextDueDate) return 1; if(!b.nextDueDate) return -1;
      return new Date(a.nextDueDate) - new Date(b.nextDueDate);
    });
    c.innerHTML = `<div style="display:grid;gap:var(--space-4)">
      ${sorted.map(plan => {
        const daysUntil = plan.nextDueDate ? Math.ceil((new Date(plan.nextDueDate)-new Date())/(86400000)) : null;
        const urgency = daysUntil!==null?(daysUntil<=0?'danger':daysUntil<=3?'warning':daysUntil<=7?'info':'success'):'neutral';
        const borderColor = urgency==='danger'?'var(--danger)':urgency==='warning'?'var(--warning)':'var(--primary)';
        return `<div class="card" style="border-left:4px solid ${borderColor}">
          <div class="card-body" style="padding:var(--space-4)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-3)">
              <div style="flex:1;min-width:300px">
                <h4 style="color:var(--text-primary);margin-bottom:var(--space-2)">${plan.name}</h4>
                <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-2)">
                  <span class="badge badge-primary" style="font-size:var(--fs-xs)">${plan.frequency}</span>
                  <span class="badge badge-neutral" style="font-size:var(--fs-xs)">Cada ${plan.intervalDays} días</span>
                  <span class="badge badge-neutral" style="font-size:var(--fs-xs)">~${plan.estimatedHours}h</span>
                  <span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--primary)">${plan.assetTag}</span>
                </div>
                <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6">${plan.tasks}</p>
              </div>
              <div style="text-align:right;min-width:150px">
                ${daysUntil!==null?`<div class="badge badge-${urgency}" style="font-size:var(--fs-sm);padding:4px 12px">${daysUntil<=0?'⚠️ VENCIDO':daysUntil===0?'📅 HOY':daysUntil+' días'}</div>`:''}
                <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--space-2)">Próximo: ${Components.Format.date(plan.nextDueDate)}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">Último: ${Components.Format.date(plan.lastExecuted)}</div>
                <div style="margin-top:var(--space-3)">${Components.ProgressBar(plan.compliance||0,100)}</div>
                ${daysUntil!==null&&daysUntil<=0?`<button class="btn btn-sm btn-warning" style="margin-top:var(--space-2)" onclick="PreventiveModule.generateWO('${plan.id}')">Generar OT</button>`:''}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  async function renderCalendar() {
    const plans = await CMMSDatabase.getAll('preventive_plans');
    const wos = await CMMSDatabase.getAll('workorders');
    const c = document.getElementById('preventive-content'); if(!c) return;
    const today = new Date();
    const year = today.getFullYear(); const month = today.getMonth();
    const firstDay = new Date(year,month,1).getDay();
    const daysInMonth = new Date(year,month+1,0).getDate();
    const monthName = today.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    // Collect events
    const events = [];
    plans.filter(p=>p.nextDueDate).forEach(p=>{
      const d=new Date(p.nextDueDate);
      if(d.getMonth()===month&&d.getFullYear()===year) events.push({day:d.getDate(),label:p.assetTag+' '+p.name.substring(0,15),type:'preventivo'});
    });
    wos.filter(wo=>wo.scheduledDate).forEach(wo=>{
      const d=new Date(wo.scheduledDate);
      if(d.getMonth()===month&&d.getFullYear()===year) events.push({day:d.getDate(),label:wo.folio,type:wo.type});
    });

    let html = `<div class="card"><div class="card-header"><h3 class="card-title" style="text-transform:capitalize">📅 ${monthName}</h3></div><div class="card-body" style="padding:var(--space-3)"><div class="calendar-grid">`;
    dayNames.forEach(d=>html+=`<div class="calendar-header-cell">${d}</div>`);
    // Empty cells before first day
    for(let i=0;i<firstDay;i++) html+=`<div class="calendar-cell other-month"></div>`;
    for(let day=1;day<=daysInMonth;day++){
      const isToday = day===today.getDate();
      const dayEvents = events.filter(e=>e.day===day);
      html+=`<div class="calendar-cell${isToday?' today':''}"><span class="calendar-day">${day}</span>${dayEvents.slice(0,3).map(e=>`<div class="calendar-event type-${e.type}" title="${e.label}">${e.label}</div>`).join('')}${dayEvents.length>3?`<div style="font-size:9px;color:var(--text-muted)">+${dayEvents.length-3} más</div>`:''}</div>`;
    }
    html+=`</div></div></div>`;
    c.innerHTML = html;
  }

  async function generateWO(planId) {
    const plan = await CMMSDatabase.getById('preventive_plans',planId); if(!plan) return;
    const asset = await CMMSDatabase.getById('assets',plan.assetId);
    const count = await CMMSDatabase.count('workorders');
    const wo = {
      folio:`OT-${String(2024000+count+1)}`, assetId:plan.assetId, assetTag:plan.assetTag,
      assetName:asset?asset.name:plan.assetTag, area:asset?asset.area:'',
      title:`${plan.name}`, description:`Ejecución de plan preventivo: ${plan.tasks}`,
      type:'preventivo', priority:'media', status:'planificada',
      assignedTo:'usr_003', requestedBy:'usr_002',
      estimatedHours:plan.estimatedHours, scheduledDate:new Date().toISOString(),
      materialCost:0, laborCost:0, safetyChecklist:{loto:null,ppe:null,permit:false}
    };
    await CMMSDatabase.create('workorders',wo);
    plan.lastExecuted = new Date().toISOString();
    plan.nextDueDate = new Date(Date.now()+plan.intervalDays*86400000).toISOString();
    await CMMSDatabase.update('preventive_plans',plan);
    Components.Toast.success(`OT ${wo.folio} generada para ${plan.assetTag}`);
    await refreshView();
  }

  async function createPlan() {
    const assets = await CMMSDatabase.getAll('assets');
    const modal = new Components.Modal({
      title:'📅 Nuevo Plan Preventivo', size:'lg',
      content:`<form id="new-plan-form"><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${Components.FormField({name:'assetId',label:'Equipo',type:'select',required:true,options:assets.map(a=>({value:a.id,label:`${a.tag} — ${a.name}`}))})}
        ${Components.FormField({name:'name',label:'Nombre del Plan',required:true,placeholder:'Ej: MP Mensual Prensa 500T'})}
        ${Components.FormField({name:'frequency',label:'Frecuencia',type:'select',required:true,options:[{value:'diario',label:'Diario'},{value:'semanal',label:'Semanal'},{value:'quincenal',label:'Quincenal'},{value:'mensual',label:'Mensual'},{value:'trimestral',label:'Trimestral'},{value:'semestral',label:'Semestral'},{value:'anual',label:'Anual'}]})}
        ${Components.FormField({name:'intervalDays',label:'Intervalo (días)',type:'number',required:true,options:{min:1}})}
        ${Components.FormField({name:'estimatedHours',label:'Horas estimadas',type:'number',options:{min:0.5,step:0.5}})}
        ${Components.FormField({name:'nextDueDate',label:'Próxima ejecución',type:'date',required:true})}
        ${Components.FormField({name:'tasks',label:'Tareas del plan',type:'textarea',className:'span-2',required:true,placeholder:'Liste las tareas a realizar...'})}
      </div></form>`,
      footer:`<button class="btn btn-ghost modal-cancel-btn">Cancelar</button><button class="btn btn-primary modal-save-btn">Guardar Plan</button>`
    });
    modal.open();
    modal.element.querySelector('.modal-cancel-btn').addEventListener('click',()=>modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click',async()=>{
      const form=document.getElementById('new-plan-form');
      if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos obligatorios');return;}
      const data=Components.readForm(form);
      const asset=await CMMSDatabase.getById('assets',data.assetId);
      data.assetTag=asset?asset.tag:''; data.status='activo'; data.compliance=0; data.lastExecuted=null;
      if(data.nextDueDate) data.nextDueDate=new Date(data.nextDueDate).toISOString();
      await CMMSDatabase.create('preventive_plans',data);
      Components.Toast.success('Plan preventivo creado');
      modal.close(); await refreshView();
    });
  }

  function setView(v){currentView=v;refreshView();}
  async function refreshView(){const mc=document.getElementById('main-content');mc.innerHTML=await render();await afterRender();}
  return {render,afterRender,setView,createPlan,generateWO,refreshView};
})();
