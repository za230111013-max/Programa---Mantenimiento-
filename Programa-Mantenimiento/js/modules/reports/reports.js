/**
 * CMMS Enterprise — Módulo de Reportes y Analytics
 * Informes predefinidos, análisis de fallas, Pareto, costos y exportación
 */
const ReportsModule = (() => {
  let currentReport = 'monthly';

  async function render() {
    const reports = [
      {id:'monthly',icon:'📊',label:'Informe Mensual',desc:'Resumen ejecutivo de mantenimiento'},
      {id:'failures',icon:'🔴',label:'Análisis de Fallas',desc:'Pareto de fallas por equipo y causa'},
      {id:'costs',icon:'💰',label:'Costos de Mtto.',desc:'Costos por área, equipo y tipo'},
      {id:'compliance',icon:'✅',label:'Cumplimiento PM',desc:'Adherencia al plan preventivo'},
      {id:'reliability',icon:'📈',label:'Confiabilidad',desc:'MTBF, MTTR y disponibilidad'},
    ];

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes y Analytics</h1>
          <p class="page-subtitle">Análisis de datos, informes y métricas de mantenimiento</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir
          </button>
          <button class="btn btn-primary" onclick="App.exportData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:240px 1fr;gap:var(--space-4)">
        <div class="card" style="align-self:start">
          <div class="card-body" style="padding:var(--space-3)">
            ${reports.map(r=>`
              <div class="nav-item ${currentReport===r.id?'active':''}" onclick="ReportsModule.selectReport('${r.id}')" style="margin-bottom:2px">
                <span class="nav-item-icon">${r.icon}</span>
                <div>
                  <div style="font-size:var(--fs-sm);font-weight:500">${r.label}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted)">${r.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div id="report-content"></div>
      </div>
    `;
  }

  async function afterRender() { await renderReport(currentReport); }

  async function selectReport(id) { currentReport=id; await renderReport(id); document.querySelectorAll('.nav-item').forEach(el=>{el.classList.remove('active');if(el.querySelector('div')&&el.onclick?.toString().includes(id))el.classList.add('active');}); }

  async function renderReport(type) {
    const c = document.getElementById('report-content'); if(!c) return;
    Components.Charts.destroyAll();
    const [assets,workorders,inventory,plans] = await Promise.all([
      CMMSDatabase.getAll('assets'),CMMSDatabase.getAll('workorders'),CMMSDatabase.getAll('inventory'),CMMSDatabase.getAll('preventive_plans')
    ]);

    switch(type) {
      case 'monthly': c.innerHTML = renderMonthly(assets,workorders,plans); break;
      case 'failures': c.innerHTML = renderFailures(workorders,assets); break;
      case 'costs': c.innerHTML = renderCosts(workorders); break;
      case 'compliance': c.innerHTML = renderCompliance(plans); break;
      case 'reliability': c.innerHTML = renderReliability(assets,workorders); break;
    }
    setTimeout(() => initReportCharts(type,assets,workorders,inventory,plans), 150);
  }

  function renderMonthly(assets,wos,plans) {
    const now = new Date(); const monthName = now.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
    const thisMonth = wos.filter(w=>{const d=new Date(w.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    const completed = thisMonth.filter(w=>['completada','cerrada'].includes(w.status)).length;
    const corrective = thisMonth.filter(w=>w.type==='correctivo').length;
    const preventive = thisMonth.filter(w=>w.type==='preventivo').length;
    const totalCost = thisMonth.filter(w=>['completada','cerrada'].includes(w.status)).reduce((s,w)=>s+(w.materialCost||0)+(w.laborCost||0),0);
    const operating = assets.filter(a=>a.status==='operando').length;
    const availability = assets.length>0?((operating/assets.length)*100).toFixed(1):0;

    return `<div class="card mb-4"><div class="card-header"><h3 class="card-title" style="text-transform:capitalize">📊 Informe Mensual — ${monthName}</h3></div><div class="card-body">
      <div class="stats-grid" style="margin-bottom:var(--space-6)">
        <div class="stat-card"><div class="stat-card-value">${thisMonth.length}</div><div class="stat-card-label">OTs Generadas</div></div>
        <div class="stat-card"><div class="stat-card-value">${completed}</div><div class="stat-card-label">OTs Completadas</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:var(--danger)">${corrective}</div><div class="stat-card-label">Correctivas</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:var(--primary)">${preventive}</div><div class="stat-card-label">Preventivas</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:var(--success)">${availability}%</div><div class="stat-card-label">Disponibilidad</div></div>
        <div class="stat-card"><div class="stat-card-value">${Components.Format.currency(totalCost)}</div><div class="stat-card-label">Costo Total</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div class="chart-container" style="height:280px"><canvas id="report-chart-1"></canvas></div>
        <div class="chart-container" style="height:280px"><canvas id="report-chart-2"></canvas></div>
      </div>
    </div></div>`;
  }

  function renderFailures(wos,assets) {
    const corrective = wos.filter(w=>w.type==='correctivo');
    const failCount = {}; corrective.forEach(w=>{failCount[w.assetTag]=(failCount[w.assetTag]||0)+1;});
    const sorted = Object.entries(failCount).sort((a,b)=>b[1]-a[1]).slice(0,15);
    const total = corrective.length;

    return `<div class="card mb-4"><div class="card-header"><h3 class="card-title">🔴 Análisis Pareto de Fallas</h3></div><div class="card-body">
      <div class="stats-grid mb-4">
        <div class="stat-card"><div class="stat-card-value">${total}</div><div class="stat-card-label">Total Fallas</div></div>
        <div class="stat-card"><div class="stat-card-value">${sorted.length>0?sorted[0][0]:'-'}</div><div class="stat-card-label">Equipo #1 Fallas</div></div>
        <div class="stat-card"><div class="stat-card-value">${sorted.length>0?sorted[0][1]:0}</div><div class="stat-card-label">Fallas en #1</div></div>
      </div>
      <div class="chart-container" style="height:350px"><canvas id="report-chart-1"></canvas></div>
    </div></div>`;
  }

  function renderCosts(wos) {
    const completed = wos.filter(w=>['completada','cerrada'].includes(w.status));
    const totalMaterial = completed.reduce((s,w)=>s+(w.materialCost||0),0);
    const totalLabor = completed.reduce((s,w)=>s+(w.laborCost||0),0);
    return `<div class="card mb-4"><div class="card-header"><h3 class="card-title">💰 Análisis de Costos de Mantenimiento</h3></div><div class="card-body">
      <div class="stats-grid mb-4">
        <div class="stat-card"><div class="stat-card-value">${Components.Format.currency(totalMaterial+totalLabor)}</div><div class="stat-card-label">Costo Total</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:var(--warning)">${Components.Format.currency(totalMaterial)}</div><div class="stat-card-label">Materiales</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:var(--info)">${Components.Format.currency(totalLabor)}</div><div class="stat-card-label">Mano de Obra</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div class="chart-container" style="height:300px"><canvas id="report-chart-1"></canvas></div>
        <div class="chart-container" style="height:300px"><canvas id="report-chart-2"></canvas></div>
      </div>
    </div></div>`;
  }

  function renderCompliance(plans) {
    const active = plans.filter(p=>p.status==='activo');
    const avgComp = active.length>0 ? active.reduce((s,p)=>s+(p.compliance||0),0)/active.length : 0;
    return `<div class="card mb-4"><div class="card-header"><h3 class="card-title">✅ Cumplimiento de Plan Preventivo</h3></div><div class="card-body">
      <div class="stats-grid mb-4">
        <div class="stat-card"><div class="stat-card-value">${active.length}</div><div class="stat-card-label">Planes Activos</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:${avgComp>=90?'var(--success)':'var(--warning)'}">${avgComp.toFixed(0)}%</div><div class="stat-card-label">Cumplimiento Promedio</div></div>
        <div class="stat-card"><div class="stat-card-value">${active.filter(p=>(p.compliance||0)>=90).length}</div><div class="stat-card-label">Meta ≥90%</div></div>
      </div>
      <div class="chart-container" style="height:350px"><canvas id="report-chart-1"></canvas></div>
    </div></div>`;
  }

  function renderReliability(assets,wos) {
    const corrective = wos.filter(w=>w.type==='correctivo');
    const totalHours = assets.reduce((s,a)=>s+(a.hoursOperated||0),0);
    const mtbf = corrective.length>0?(totalHours/corrective.length):0;
    const completed = corrective.filter(w=>w.actualHours);
    const mttr = completed.length>0?completed.reduce((s,w)=>s+(w.actualHours||0),0)/completed.length:0;
    const operating = assets.filter(a=>a.status==='operando').length;
    const availability = assets.length>0?((operating/assets.length)*100):0;

    return `<div class="card mb-4"><div class="card-header"><h3 class="card-title">📈 Indicadores de Confiabilidad</h3></div><div class="card-body">
      <div class="stats-grid mb-4">
        <div class="stat-card"><div class="stat-card-value">${mtbf.toFixed(0)} hrs</div><div class="stat-card-label">MTBF</div></div>
        <div class="stat-card"><div class="stat-card-value">${mttr.toFixed(1)} hrs</div><div class="stat-card-label">MTTR</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:${availability>=95?'var(--success)':'var(--warning)'}">${availability.toFixed(1)}%</div><div class="stat-card-label">Disponibilidad</div></div>
        <div class="stat-card"><div class="stat-card-value">${corrective.length}</div><div class="stat-card-label">Total Fallas</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        <div class="chart-container" style="height:300px"><canvas id="report-chart-1"></canvas></div>
        <div class="chart-container" style="height:300px"><canvas id="report-chart-2"></canvas></div>
      </div>
    </div></div>`;
  }

  function initReportCharts(type,assets,wos,inv,plans) {
    switch(type) {
      case 'monthly': {
        const months=[]; const corr=[]; const prev=[]; const pred=[];
        for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(d.toLocaleDateString('es-MX',{month:'short'}));
          const m=wos.filter(w=>{const wd=new Date(w.createdAt);return wd.getMonth()===d.getMonth()&&wd.getFullYear()===d.getFullYear();});
          corr.push(m.filter(w=>w.type==='correctivo').length);prev.push(m.filter(w=>w.type==='preventivo').length);pred.push(m.filter(w=>w.type==='predictivo').length);
        }
        Components.Charts.create('report-chart-1',{type:'bar',data:{labels:months,datasets:[
          {label:'Correctivo',data:corr,backgroundColor:'rgba(239,68,68,0.7)',borderRadius:4},
          {label:'Preventivo',data:prev,backgroundColor:'rgba(59,130,246,0.7)',borderRadius:4},
          {label:'Predictivo',data:pred,backgroundColor:'rgba(139,92,246,0.7)',borderRadius:4}
        ]},options:{plugins:{legend:{position:'top'}},scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}}}});
        const types={correctivo:wos.filter(w=>w.type==='correctivo').length,preventivo:wos.filter(w=>w.type==='preventivo').length,predictivo:wos.filter(w=>w.type==='predictivo').length,mejora:wos.filter(w=>w.type==='mejora').length};
        Components.Charts.create('report-chart-2',{type:'doughnut',data:{labels:['Correctivo','Preventivo','Predictivo','Mejora'],datasets:[{data:Object.values(types),backgroundColor:['#ef4444','#3b82f6','#8b5cf6','#10b981'],borderWidth:0}]},options:{cutout:'60%',plugins:{legend:{position:'bottom'}}}});
        break;
      }
      case 'failures': {
        const corrective=wos.filter(w=>w.type==='correctivo');
        const failCount={};corrective.forEach(w=>{failCount[w.assetTag]=(failCount[w.assetTag]||0)+1;});
        const sorted=Object.entries(failCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
        let cumulative=0;const total=corrective.length;
        Components.Charts.create('report-chart-1',{type:'bar',data:{labels:sorted.map(s=>s[0]),datasets:[{label:'Fallas',data:sorted.map(s=>s[1]),backgroundColor:sorted.map((_,i)=>i<3?'rgba(239,68,68,0.7)':'rgba(59,130,246,0.5)'),borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}});
        break;
      }
      case 'costs': {
        const completed=wos.filter(w=>['completada','cerrada'].includes(w.status));
        const byArea={};completed.forEach(w=>{const a=w.area||'Sin área';if(!byArea[a])byArea[a]={material:0,labor:0};byArea[a].material+=(w.materialCost||0);byArea[a].labor+=(w.laborCost||0);});
        const areas=Object.keys(byArea).sort();
        Components.Charts.create('report-chart-1',{type:'bar',data:{labels:areas,datasets:[
          {label:'Material',data:areas.map(a=>byArea[a].material),backgroundColor:'rgba(245,158,11,0.7)',borderRadius:4},
          {label:'M.O.',data:areas.map(a=>byArea[a].labor),backgroundColor:'rgba(6,182,212,0.7)',borderRadius:4}
        ]},options:{scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true,ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        const months=[];const matData=[];const labData=[];
        for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(d.toLocaleDateString('es-MX',{month:'short'}));
          const m=completed.filter(w=>{const wd=new Date(w.completedAt||w.createdAt);return wd.getMonth()===d.getMonth()&&wd.getFullYear()===d.getFullYear();});
          matData.push(m.reduce((s,w)=>s+(w.materialCost||0),0));labData.push(m.reduce((s,w)=>s+(w.laborCost||0),0));
        }
        Components.Charts.create('report-chart-2',{type:'line',data:{labels:months,datasets:[
          {label:'Material',data:matData,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.1)',fill:true,tension:0.4},
          {label:'M.O.',data:labData,borderColor:'#06b6d4',backgroundColor:'rgba(6,182,212,0.1)',fill:true,tension:0.4}
        ]},options:{scales:{y:{beginAtZero:true,ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});
        break;
      }
      case 'compliance': {
        const active=plans.filter(p=>p.status==='activo').sort((a,b)=>(a.compliance||0)-(b.compliance||0));
        Components.Charts.create('report-chart-1',{type:'bar',data:{labels:active.map(p=>p.assetTag),datasets:[{label:'Cumplimiento %',data:active.map(p=>p.compliance||0),backgroundColor:active.map(p=>(p.compliance||0)>=90?'rgba(16,185,129,0.7)':(p.compliance||0)>=75?'rgba(245,158,11,0.7)':'rgba(239,68,68,0.7)'),borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}}});
        break;
      }
      case 'reliability': {
        const months=[];const mtbfData=[];const mttrData=[];
        for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(d.toLocaleDateString('es-MX',{month:'short'}));
          const m=wos.filter(w=>{const wd=new Date(w.createdAt);return wd.getMonth()===d.getMonth()&&wd.getFullYear()===d.getFullYear();});
          const corr=m.filter(w=>w.type==='correctivo');
          const totalH=assets.reduce((s,a)=>s+(a.hoursOperated||0),0)/6;
          mtbfData.push(corr.length>0?(totalH/corr.length):totalH);
          const comp=corr.filter(w=>w.actualHours);
          mttrData.push(comp.length>0?comp.reduce((s,w)=>s+(w.actualHours||0),0)/comp.length:0);
        }
        Components.Charts.create('report-chart-1',{type:'line',data:{labels:months,datasets:[{label:'MTBF (hrs)',data:mtbfData,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,pointRadius:5}]},options:{scales:{y:{beginAtZero:true,title:{display:true,text:'Horas'}}}}});
        Components.Charts.create('report-chart-2',{type:'line',data:{labels:months,datasets:[{label:'MTTR (hrs)',data:mttrData,borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',fill:true,tension:0.4,pointRadius:5}]},options:{scales:{y:{beginAtZero:true,title:{display:true,text:'Horas'}}}}});
        break;
      }
    }
  }

  return {render,afterRender,selectReport};
})();
