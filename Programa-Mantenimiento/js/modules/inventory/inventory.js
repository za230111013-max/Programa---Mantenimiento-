/**
 * CMMS Enterprise — Módulo de Inventario de Repuestos
 * Catálogo, control de stock, movimientos y alertas
 */
const InventoryModule = (() => {
  async function render() {
    const inv = await CMMSDatabase.getAll('inventory');
    const total = inv.length;
    const lowStock = inv.filter(i => i.currentStock <= i.minStock).length;
    const totalValue = inv.reduce((s,i) => s + (i.currentStock * i.unitCost), 0);
    const categories = [...new Set(inv.map(i => i.category))].length;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Inventario de Repuestos</h1>
          <p class="page-subtitle">Catálogo de repuestos, control de stock y movimientos de almacén</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="InventoryModule.showMovements()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            Movimientos
          </button>
          <button class="btn btn-primary" onclick="InventoryModule.addPart()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Repuesto
          </button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${Components.KPICard({title:'Total Repuestos',value:total,icon:'📦',color:'var(--primary)'})}
        ${Components.KPICard({title:'Categorías',value:categories,icon:'📂',color:'var(--info)'})}
        ${Components.KPICard({title:'Stock Bajo',value:lowStock,icon:'⚠️',color:lowStock>0?'var(--danger)':'var(--success)',subtitle:lowStock>0?'Requieren reabastecimiento':'Todo OK'})}
        ${Components.KPICard({title:'Valor Total',value:Components.Format.currency(totalValue),icon:'💰',color:'var(--accent)'})}
      </div>
      <div class="card"><div class="card-header">
        <h3 class="card-title">📦 Catálogo de Repuestos</h3>
        <div style="display:flex;gap:var(--space-2)">
          <select class="form-control form-control-sm" id="inv-filter-cat" onchange="InventoryModule.afterRender()" style="width:160px">
            <option value="">Todas las categorías</option>
            ${[...new Set(inv.map(i=>i.category))].sort().map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select>
          <select class="form-control form-control-sm" id="inv-filter-stock" onchange="InventoryModule.afterRender()" style="width:140px">
            <option value="">Todo Stock</option>
            <option value="low">Stock Bajo</option>
            <option value="ok">Stock OK</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0"><div id="inv-datatable"></div></div></div>
    `;
  }

  async function afterRender() {
    let inv = await CMMSDatabase.getAll('inventory');
    const catFilter = document.getElementById('inv-filter-cat')?.value || '';
    const stockFilter = document.getElementById('inv-filter-stock')?.value || '';
    if(catFilter) inv = inv.filter(i => i.category === catFilter);
    if(stockFilter==='low') inv = inv.filter(i => i.currentStock <= i.minStock);
    if(stockFilter==='ok') inv = inv.filter(i => i.currentStock > i.minStock);

    const dt = new Components.DataTable('inv-datatable', {
      data: inv, pageSize: 20, searchable: true, exportable: true,
      columns: [
        {key:'code',label:'Código',width:'130px',render:v=>`<code style="font-size:var(--fs-xs);color:var(--primary)">${v}</code>`},
        {key:'name',label:'Descripción',render:(v,r)=>`<div><span>${v}</span><br><span style="font-size:var(--fs-xs);color:var(--text-muted)">${r.category}</span></div>`},
        {key:'currentStock',label:'Stock',width:'120px',align:'center',render:(v,r)=>{
          const pct=r.maxStock>0?(v/r.maxStock)*100:0;
          const cls=v<=r.minStock?'stock-critical':v<=r.reorderPoint?'stock-low':'stock-ok';
          return `<div class="stock-indicator"><div class="stock-bar"><div class="stock-bar-fill ${cls}" style="width:${Math.min(pct,100)}%"></div></div><span class="stock-value" style="color:${v<=r.minStock?'var(--danger)':'var(--text-primary)'}">${v}</span></div>`;
        }},
        {key:'minStock',label:'Mín',width:'60px',align:'center'},
        {key:'maxStock',label:'Máx',width:'60px',align:'center'},
        {key:'unit',label:'Unidad',width:'70px',align:'center'},
        {key:'unitCost',label:'Costo Unit.',width:'100px',align:'right',render:v=>Components.Format.currency(v)},
        {key:'location',label:'Ubicación',width:'80px',render:v=>`<span style="font-family:var(--font-mono);font-size:var(--fs-xs)">${v}</span>`},
        {key:'supplier',label:'Proveedor',width:'130px',render:v=>`<span style="font-size:var(--fs-xs)">${v}</span>`}
      ],
      actions:[
        {name:'entry',label:'Entrada',icon:'<span style="color:var(--success)">+</span>',handler:r=>registerMovement(r,'entrada')},
        {name:'exit',label:'Salida',icon:'<span style="color:var(--danger)">-</span>',handler:r=>registerMovement(r,'salida')}
      ],
      rowClass: r => r.currentStock<=r.minStock ? 'row-danger' : ''
    });
    dt.render();
  }

  async function registerMovement(part, type) {
    const modal = new Components.Modal({
      title:`${type==='entrada'?'📥 Entrada':'📤 Salida'} — ${part.code}`,size:'sm',
      content:`<form id="mov-form">
        <p style="color:var(--text-secondary);margin-bottom:var(--space-3)"><strong>${part.name}</strong><br>Stock actual: <strong>${part.currentStock} ${part.unit}</strong></p>
        ${Components.FormField({name:'quantity',label:'Cantidad',type:'number',required:true,options:{min:1}})}
        ${Components.FormField({name:'reason',label:'Motivo',type:'select',required:true,options:type==='entrada'?[{value:'compra',label:'Compra'},{value:'devolucion',label:'Devolución'},{value:'ajuste',label:'Ajuste inventario'}]:[{value:'consumo_ot',label:'Consumo en OT'},{value:'transferencia',label:'Transferencia'},{value:'ajuste',label:'Ajuste inventario'}]})}
        ${Components.FormField({name:'notes',label:'Notas',placeholder:'Referencia, # OT, etc.'})}
      </form>`,
      footer:`<button class="btn btn-ghost modal-cancel-btn">Cancelar</button><button class="btn btn-${type==='entrada'?'success':'danger'} modal-save-btn">${type==='entrada'?'Registrar Entrada':'Registrar Salida'}</button>`
    });
    modal.open();
    modal.element.querySelector('.modal-cancel-btn').addEventListener('click',()=>modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click',async()=>{
      const form=document.getElementById('mov-form');
      if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos');return;}
      const data=Components.readForm(form);
      if(type==='salida'&&data.quantity>part.currentStock){Components.Toast.error('Stock insuficiente');return;}
      // Update stock
      part.currentStock = type==='entrada' ? part.currentStock+data.quantity : part.currentStock-data.quantity;
      await CMMSDatabase.update('inventory',part);
      // Register movement
      await CMMSDatabase.create('inventory_movements',{
        partId:part.id,partCode:part.code,partName:part.name,
        type:type,quantity:data.quantity,reason:data.reason,notes:data.notes,
        previousStock:type==='entrada'?part.currentStock-data.quantity:part.currentStock+data.quantity,
        newStock:part.currentStock,unitCost:part.unitCost,totalCost:data.quantity*part.unitCost,
        date:new Date().toISOString(),userId:Store.get('currentUser')?.id||'usr_001'
      });
      Components.Toast.success(`${type==='entrada'?'Entrada':'Salida'} registrada: ${data.quantity} ${part.unit} de ${part.code}`);
      modal.close(); await afterRender();
    });
  }

  async function showMovements() {
    const movements = await CMMSDatabase.getAll('inventory_movements');
    const sorted = movements.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,50);
    const modal = new Components.Modal({
      title:'📦 Movimientos de Inventario',size:'lg',
      content:`<div style="max-height:500px;overflow-y:auto">
        ${sorted.length===0?'<p style="text-align:center;color:var(--text-muted);padding:var(--space-6)">Sin movimientos registrados</p>':`
        <table class="datatable" style="width:100%"><thead><tr>
          <th>Fecha</th><th>Código</th><th>Tipo</th><th>Cant.</th><th>Motivo</th><th>Stock</th>
        </tr></thead><tbody>
          ${sorted.map(m=>`<tr>
            <td style="font-size:var(--fs-xs)">${Components.Format.datetime(m.date)}</td>
            <td><code style="font-size:var(--fs-xs);color:var(--primary)">${m.partCode}</code></td>
            <td>${m.type==='entrada'?'<span class="badge badge-success">Entrada</span>':'<span class="badge badge-danger">Salida</span>'}</td>
            <td style="text-align:center;font-weight:600;color:${m.type==='entrada'?'var(--success)':'var(--danger)'}"> ${m.type==='entrada'?'+':'-'}${m.quantity}</td>
            <td style="font-size:var(--fs-xs)">${m.reason||'—'}</td>
            <td style="font-family:var(--font-mono);font-size:var(--fs-xs)">${m.previousStock}→${m.newStock}</td>
          </tr>`).join('')}
        </tbody></table>`}
      </div>`
    });
    modal.open();
  }

  async function addPart() {
    const modal = new Components.Modal({
      title:'📦 Nuevo Repuesto',size:'lg',
      content:`<form id="new-part-form"><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${Components.FormField({name:'code',label:'Código',required:true,placeholder:'Ej: ROD-6205-2RS'})}
        ${Components.FormField({name:'name',label:'Descripción',required:true,placeholder:'Ej: Rodamiento 6205-2RS'})}
        ${Components.FormField({name:'category',label:'Categoría',type:'select',required:true,options:['Rodamientos','Sellos','Filtros','Bandas','Lubricantes','Eléctrico','Neumática','Hidráulica','Soldadura','Herramientas','Consumibles'].map(c=>({value:c,label:c}))})}
        ${Components.FormField({name:'unit',label:'Unidad',type:'select',required:true,options:[{value:'pza',label:'Pieza'},{value:'kit',label:'Kit'},{value:'metro',label:'Metro'},{value:'cubeta',label:'Cubeta'},{value:'rollo',label:'Rollo'},{value:'caja',label:'Caja'},{value:'paq',label:'Paquete'}]})}
        ${Components.FormField({name:'currentStock',label:'Stock Actual',type:'number',required:true,options:{min:0}})}
        ${Components.FormField({name:'minStock',label:'Stock Mínimo',type:'number',required:true,options:{min:0}})}
        ${Components.FormField({name:'maxStock',label:'Stock Máximo',type:'number',options:{min:0}})}
        ${Components.FormField({name:'reorderPoint',label:'Punto de Reorden',type:'number',options:{min:0}})}
        ${Components.FormField({name:'unitCost',label:'Costo Unitario (MXN)',type:'number',required:true,options:{min:0}})}
        ${Components.FormField({name:'location',label:'Ubicación Almacén',placeholder:'Ej: A1-01'})}
        ${Components.FormField({name:'supplier',label:'Proveedor',placeholder:'Nombre del proveedor'})}
        ${Components.FormField({name:'leadTime',label:'Lead Time (días)',type:'number',options:{min:0}})}
      </div></form>`,
      footer:`<button class="btn btn-ghost modal-cancel-btn">Cancelar</button><button class="btn btn-primary modal-save-btn">Guardar</button>`
    });
    modal.open();
    modal.element.querySelector('.modal-cancel-btn').addEventListener('click',()=>modal.close());
    modal.element.querySelector('.modal-save-btn').addEventListener('click',async()=>{
      const form=document.getElementById('new-part-form');
      if(!Components.validateForm(form)){Components.Toast.warning('Complete los campos obligatorios');return;}
      const data=Components.readForm(form);
      await CMMSDatabase.create('inventory',data);
      Components.Toast.success(`Repuesto ${data.code} creado`);
      modal.close();
      const mc=document.getElementById('main-content'); mc.innerHTML=await render(); await afterRender();
    });
  }

  return {render,afterRender,showMovements,addPart};
})();
