// UYGA YORDAM — customer growth + service pricing layer
// Keeps existing visual structure unchanged.
(function(){
  const SERVICES=[
    {name:'Уй тозалаш',price:80000,unit:'бошланғич',desc:'Квартира/уй тозалаш; якуний нарх майдон ва иш ҳажмига қараб аниқланади.'},
    {name:'Кир ювиш',price:60000,unit:'бошланғич',desc:'Кир ювиш ва мато буюмлари; оғирлик/турига қараб.'},
    {name:'Диван / матрас',price:120000,unit:'бошланғич',desc:'Кимёвий тозалаш; ўлчам ва буюм турига қараб.'},
    {name:'Бозордан олиб келиш',price:30000,unit:'хизматдан',desc:'Харид ва етказиб бериш; маҳсулот пули алоҳида.'},
    {name:'Курьер',price:30000,unit:'хизматдан',desc:'Етказиб бериш; масофага қараб якуний ҳисоб.'},
    {name:'Сантехник',price:50000,unit:'чақирувдан',desc:'Диагностика/майда иш; материаллар алоҳида.'},
    {name:'Кондиционер',price:100000,unit:'хизматдан',desc:'Текширув/сервис; иш турига қараб.'},
    {name:'Маиший техника',price:100000,unit:'хизматдан',desc:'Диагностика/майда таъмир; эҳтиёт қисмлар алоҳида.'},
    {name:'Мебель',price:100000,unit:'хизматдан',desc:'Йиғиш/таъмир; ҳажм ва мураккабликка қараб.'},
    {name:'Боғбон',price:100000,unit:'хизматдан',desc:'Боғ ишлари; майдон ва иш ҳажмига қараб.'},
    {name:'Юк ташиш',price:150000,unit:'хизматдан',desc:'Машина/юк ҳажми ва масофага қараб.'},
    {name:'Электрик',price:50000,unit:'чақирувдан',desc:'Диагностика/майда иш; материаллар алоҳида.'}
  ];
  window.UYGA_SERVICES=SERVICES;
  window.UYGA_PROMO={firstOrderDiscount:10,referralBonus:20000,repeatBonus:5};

  function money(n){return Number(n||0).toLocaleString('ru-RU')+' сўм';}
  function render(){
    const box=document.getElementById('services');
    if(!box)return;
    box.innerHTML=SERVICES.map((s,i)=>`<div class="card"><div style="font-size:28px">${['🧹','🧺','🛋️','🛒','🚚','🔧','❄️','🔌','🪑','🌿','🚛','⚡'][i]}</div><h3>${s.name}</h3><div class="price">${money(s.price)} <span class="small">${s.unit}</span></div><p class="mut small">${s.desc}</p><button type="button" class="cta" onclick="window.chooseService&&window.chooseService(${i})">Буюртма бериш</button></div>`).join('');
  }

  function installAdminGpsPanel(){
    const admin=document.getElementById('admin'), orders=document.getElementById('adminOrders');
    if(!admin||!orders||admin.classList.contains('hidden'))return;
    if(document.getElementById('adminGpsEvidence'))return;
    const panel=document.createElement('div');
    panel.id='adminGpsEvidence';
    panel.className='panel';
    panel.style.cssText='margin:0 0 12px;padding:14px;border-radius:16px;background:#eef8f6;border:1px solid #cfe4df;';
    panel.innerHTML='<div style="font-weight:900;font-size:16px">📍 Ходим GPS далили</div><div id="adminGpsEvidenceBody" style="margin-top:8px;color:#526966">Маълумот олинмоқда...</div>';
    orders.parentNode.insertBefore(panel,orders);
    refreshAdminGpsPanel();
  }

  async function refreshAdminGpsPanel(){
    const body=document.getElementById('adminGpsEvidenceBody');
    if(!body||typeof window.api!=='function')return;
    try{
      const data=await window.api('/api/orders');
      const rows=Array.isArray(data)?data:(data&&data.orders)||[];
      const gpsRows=rows.filter(o=>o.workerGps&&Number.isFinite(Number(o.workerGps.lat))&&Number.isFinite(Number(o.workerGps.lon)));
      if(!gpsRows.length){body.innerHTML='Ҳозирча ходимдан GPS далили сақланмаган.';return;}
      body.innerHTML=gpsRows.map(o=>{
        const g=o.workerGps, tm=o.worker_time||'';
        const when=tm?new Date(tm).toLocaleString('uz-UZ',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'вақт кўрсатилмаган';
        const map='https://www.google.com/maps?q='+encodeURIComponent(g.lat+','+g.lon);
        return '<div style="padding:9px 0;border-top:1px solid #d5e7e3"><b>'+String(o.id||'').replace(/[&<>]/g,'')+'</b> — '+String(o.name||'').replace(/[&<>]/g,'')+'<br>📍 '+Number(g.lat).toFixed(7)+', '+Number(g.lon).toFixed(7)+'<br>🕐 '+when+'<br><a href="'+map+'" target="_blank" rel="noopener" style="color:#087f79;font-weight:900">🗺 Харитада очиш</a></div>';
      }).join('');
    }catch(e){body.innerHTML='GPS маълумотини олишда хато. Админ кабинетига қайта киринг.';}
  }

  function startAdminGps(){
    let busy=false;
    setInterval(async function(){
      const admin=document.getElementById('admin');
      if(!admin||admin.classList.contains('hidden'))return;
      installAdminGpsPanel();
      if(busy)return;
      busy=true;
      try{await refreshAdminGpsPanel()}finally{busy=false}
    },5000);
  }

  window.UYGA_PRICE_FORMAT=money;
  window.addEventListener('DOMContentLoaded',function(){render();startAdminGps()});
})();
