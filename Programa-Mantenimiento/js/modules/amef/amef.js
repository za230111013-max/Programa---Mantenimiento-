/**
 * CMMS Enterprise — Módulo AMEF / RCM
 * Análisis de Modo y Efecto de Fallas, cálculo NPR, causa raíz
 */
const AMEFModule = (() => {
  async function render() {
    const amefs = await CMMSDatabase.getAll('amef');
    const total = amefs.length;
    const critical = amefs.filter(a => a.npr >= 200).length;
    const high = amefs.filter(a => a.npr >= 120 && a.npr < 200).length;
    const implemented = amefs.filter(a => a.status === 'implementado').length;
    const pending = amefs.filter(a => a.status === 'pendiente').length;
    const avgNPR = total > 0 ? amefs.reduce((s,a) => s+a.npr, 0)/total : 0;
    const avgNewNPR = amefs.filter(a=>a.newNpr).length>0 ? amefs.filter(a=>a.newNpr).reduce((s,a)=>s+a.newNpr,0)/amefs.filter(a=>a.newNpr).length : 0;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Análisis AMEF / RCM</h1>
          <p class="page-subtitle">Análisis de Modo y Efecto de Fallas — Mejora continua y confiabilidad</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="AMEFModule.newAnalysis()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Análisis
          </button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
        ${Components.KPICard({title:'Total Análisis',value:total,icon:'📊',color:'var(--primary)'})}
        ${Components.KPICard({title:'NPR Crítico (≥200)',value:critical,icon:'🔴',color:'var(--danger)'})}
        ${Components.KPICard({title:'NPR Alto (≥120)',value:high,icon:'🟡',color:'var(--warning)'})}
        ${Components.KPICard({title:'Implementados',value:implemented,icon:'✅',color:'var(--success)'})}
        ${Components.KPICard({title:'Pendientes',value:pending,icon:'⏳',color:pending>0?'var(--danger)':'var(--success)'})}
        ${Components.KPICard({title:'NPR Promedio',value:avgNPR.toFixed(0),icon:'📈',color:avgNPR>=150?'var(--danger)':'var(--success)',subtitle:avgNewNPR>0?'Post-acción: '+avgNewNPR.toFixed(0):''})}
      </div>
      <div class="card"><div class="card-header"><h3 class="card-title">📋 Matriz AMEF</h3>
        <div style="display:flex;gap:var(--space-2)">
          <span class="badge npr-critical" style="font-size:10px">NPR ≥200 Crítico</span>
          <span class="badge npr-high" style="font-size:10px">NPR ≥120 Alto</span>
          <span class="badge npr-medium" style="font-size:10px">NPR ≥80 Medio</span>
          <span class="badge npr-low" style="font-size:10px">NPR &lt;80 Bajo</span>
        </div>
      </div>
      <div class="card-body" style="padding:0"><div class="amef-matrix" id="amef-matrix"></div></div></div>

      <div class="charts-grid mt-6">
        <div class="card"><div class="card-header"><h3 class="card-title">Distribución NPR</h3></div>
          <div class="card-body"><div class="chart-container" style="height:280px"><canvas id="chart-npr-dist"></canvas></div></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">Reducción NPR (Antes vs Después)</h3></div>
          <div class="card-body"><div class="chart-container" style="height:280px"><canvas id="chart-npr-reduction"></canvas></div></div></div>
      </div>
    `;
  }

  async function afterRender() {
    const amefs = await CMMSDatabase.getAll('amef');
    renderMatrix(amefs);
    renderCharts(amefs);
  }

  function renderMatrix(amefs) {
    const c = document.getElementById('amef-matrix'); if(!c) return;
    const sorted = [...amefs].sort((a,b) => b.npr - a.npr);
    c.innerHTML = `<table class="datatable" style="width:100%;min-width:1100px"><thead><tr>
      <th>Equipo</th><th>Componente</th><th>Modo de Falla</th><th>Efecto</th><th>Causa</th>
      <th style="text-align:center">S</th><th style="text-align:center">O</th><th style="text-align:center">D</th>
      <th style="text-align:center">NPR</th><th>Acción</th><th style="text-align:center">NPR Rev.</th><th>Estado</th>
    </tr></thead><tbody>
      ${sorted.map(a => {
        const nprClass = a.npr>=200?'npr-critical':a.npr>=120?'npr-high':a.npr>=80?'npr-medium':'npr-low';
        const newNprClass = a.newNpr?(a.newNpr>=200?'npr-critical':a.newNpr>=120?'npr-high':a.newNpr>=80?'npr-medium':'npr-low'):'';
        const statusMap = {implementado:{label:'Implementado',class:'badge-success'},en_proceso:{label:'En Proceso',class:'badge-warning'},pendiente:{label:'Pendiente',class:'badge-danger'}};
        return `<tr>
          <td><span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--primary)">${a.assetTag}</span></td>
          <td style="font-size:var(--fs-sm)">${a.component}</td>
          <td style="font-size:var(--fs-sm)">${a.failureMode}</td>
          <td style="font-size:var(--fs-xs);max-width:150px" class="truncate" title="${a.failureEffect}">${a.failureEffect}</td>
          <td style="font-size:var(--fs-xs);max-width:120px" class="truncate" title="${a.failureCause}">${a.failureCause}</td>
          <td style="text-align:center;font-weight:600">${a.severity}</td>
          <td style="text-align:center;font-weight:600">${a.occurrence}</td>
          <td style="text-align:center;font-weight:600">${a.detection}</td>
          <td style="text-align:center"><span class="npr-badge ${nprClass}">${a.npr}</span></td>
          <td style="font-size:var(--fs-xs);max-width:180px" class="truncate" title="${a.action}">${a.action}</td>
          <td style="text-align:center">${a.newNpr?`<span class="npr-badge ${newNprClass}">${a.newNpr}</span>`:'—'}</td>
          <td>${Components.StatusBadge(a.status, statusMap)}</td>
        </tr>`;
      }).join('')}
    </tbody></table>`;
  }

  function renderCharts(amefs) {
    // NPR Distribution
    const critical = amefs.filter(a=>a.npr>=200).length;
    const high = amefs.filter(a=>a.npr>=120&&a.npr<200).length;
    const medium = amefs.filter(a=>a.npr>=80&&a.npr<120).length;
    const low = amefs.filter(a=>a.npr<80).length;

    Components.Charts.create('chart-npr-dist',{
      type:'doughnut',
      data:{labels:['Crítico (≥200)','Alto (120-199)','Medio (80-119)','Bajo (<80)'],
        datasets:[{data:[critical,high,medium,low],backgroundColor:['#ef4444','#f59e0b','#06b6d4','#10b981'],borderWidth:0,hoverOffset:8}]},
      options:{cutout:'60%',plugins:{legend:{position:'bottom'}}}
    });

    // NPR Reduction
    const withReduction = amefs.filter(a => a.newNpr !== null && a.newNpr !== undefined);
    Components.Charts.create('chart-npr-reduction',{
      type:'bar',
      data:{labels:withReduction.map(a=>a.assetTag),
        datasets:[
          {label:'NPR Original',data:withReduction.map(a=>a.npr),backgroundColor:'rgba(239,68,68,0.7)',borderRadius:4},
          {label:'NPR Revisado',data:withReduction.map(a=>a.newNpr),backgroundColor:'rgba(16,185,129,0.7)',borderRadius:4}
        ]},
      options:{plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,title:{display:true,text:'NPR'}}}}
    });
  }

  async function newAnalysis() {
    const assets = await CMMSDatabase.getAll('assets');
    const modal = new Components.Modal({
      title:'⚠️ Nuevo Análisis AMEF',size:'xl',
      content:`<form id="new-amef-form"><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${Components.FormField({name:'assetId',label:'Equipo',type:'select',required:true,options:assets.map(a=>({value:a.id,label:`${a.tag} — ${a.name}`}))})}
        ${Components.FormField({name:'component',label:'Componente',required:true,placeholder:'Ej: Cilindro hidráulico principal'})}
        ${Components.FormField({name:'function',label:'Función',required:true,placeholder:'Ej: Generar fuerza de estampado',className:'span-2'})}
        ${Components.FormField({name:'failureMode',label:'Modo de Falla',required:true,placeholder:'Ej: Pérdida de presión'})}
        ${Components.FormField({name:'failureEffect',label:'Efecto de la Falla',required:true,placeholder:'Ej: Pieza defectuosa, paro de línea'})}
        ${Components.FormField({name:'failureCause',label:'Causa de la Falla',required:true,placeholder:'Ej: Desgaste de sellos del pistón',className:'span-2'})}
        ${Components.FormField({name:'severity',label:'Severidad (1-10)',type:'number',required:true,options:{min:1,max:10},help:'10=Mayor impacto'})}
        ${Components.FormField({name:'occurrence',label:'Ocurrencia (1-10)',type:'number',required:true,options:{min:1,max:10},help:'10=Muy frecuente'})}
        ${Components.FormField({name:'detection',label:'Detección (1-10)',type:'number',required:true,options:{min:1,max:10},help:'10=Imposible detectar'})}
        <div class="form-group"><label class="form-label">NPR Calculado</label><div id="npr-preview" style="font-size:var(--fs-2xl);font-weight:700;color:var(--primary)">—</div><span class="form-help">S × O × D = NPR</span></div>
        ${Components.FormField({name:'action',label:'Acción Recomendada',type:'textarea',className:'span-2',required:true,placeholder:'Describa la acción correctiva/preventiva recomendada'})}
      </div></form>`,
      footer:`<button class="btn btn-ghost modal-cancel-btn">Cancelar</button><button class="btn btn-primary modal-save-btn">Guardar Análisis</button>`
    });
    modal.open();

    // NPR auto-calc
    const calcNPR = () => {
      const s=parseInt(document.getElementById('field-severity')?.value)||0;
      const o=parseInt(document.getElementById('field-occurrence')?.value)||0;
      const d=parseInt(document.getElementById('field-detection')?.value)||0;
      const npr=s*o*d;
      const el=document.getElementById('npr-preview');
      if(el){
        const cls=npr>=200?'var(--danger)':npr>=120?'var(--warning)':npr>=80?'var(--info)':'var(--success)';
        el.textContent=npr>0?npr:'—';
        el.style.color=cls;
      }
    };
    ['severity','occurrence','detection'].forEach(f=>{
      const el=modal.element.querySelector(`#field-${f}`);
      if(el) el.addEventListener('input',calcNPR);
    });

    modal.element.querySelector('.modal-cancel-btn').addEventListener('click',()=>modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click',async()=>{
      const form=document.getElementById('new-amef-form');
      if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos obligatorios');return;}
      const data=Components.readForm(form);
      const asset=await CMMSDatabase.getById('assets',data.assetId);
      data.assetTag=asset?asset.tag:'';
      data.npr=data.severity*data.occurrence*data.detection;
      data.newSeverity=null;data.newOccurrence=null;data.newDetection=null;data.newNpr=null;
      data.status='pendiente';data.actionOwner=Store.get('currentUser')?.id||'usr_001';
      await CMMSDatabase.create('amef',data);
      Components.Toast.success('Análisis AMEF creado');
      modal.close();
      Components.Charts.destroyAll();
      const mc=document.getElementById('main-content');mc.innerHTML=await render();await afterRender();
    });
  }

  return {render,afterRender,newAnalysis};
})();
