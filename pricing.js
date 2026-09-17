// UYGA YORDAM — customer growth + service pricing layer
// Current starting prices for external-worker operating model.
(function(){
  const SERVICES=[
    {name:'Уй тозалаш',price:200000,unit:'бошланғич',desc:'Квартира/уй тозалаш; якуний нарх майдон ва иш ҳажмига қараб аниқланади.'},
    {name:'Кир ювиш ва дазмоллаш',price:120000,unit:'бошланғич',desc:'Кир ювиш ва дазмоллаш; ҳажм ва буюм турига қараб.'},
    {name:'Гилам ва матрас тозалаш',price:80000,unit:'бошланғич',desc:'Гилам/матрас тозалаш; ўлчам ва буюм турига қараб якуний ҳисобланади.'},
    {name:'Бозор қилиб бериш',price:50000,unit:'хизматдан',desc:'Харид қилиб бериш ва етказиш; маҳсулот пули алоҳида.'},
    {name:'Курьер',price:30000,unit:'хизматдан',desc:'Етказиб бериш; масофага қараб якуний ҳисобланади.'},
    {name:'Сантехник',price:150000,unit:'чақирувдан',desc:'Чақирув ва диагностика; мураккаб иш ҳамда материаллар алоҳида.'},
    {name:'Кондиционер',price:100000,unit:'бошланғич',desc:'Текширув/сервис; иш тури ва кондиционер ҳолатига қараб.'},
    {name:'Маиший техника таъмирлаш',price:100000,unit:'бошланғич',desc:'Диагностика/майда таъмир; эҳтиёт қисмлар алоҳида.'},
    {name:'Мебел йиғиш',price:100000,unit:'бошланғич',desc:'Йиғиш/ўрнатиш; ҳажм ва мураккабликка қараб.'},
    {name:'Боғбон / ландшафт',price:100000,unit:'бошланғич',desc:'Боғ ишлари; майдон ва иш ҳажмига қараб.'},
    {name:'Юк ташиш',price:150000,unit:'бошланғич',desc:'Машина/юк ҳажми ва масофага қараб; қўшимча юкчилар алоҳида ҳисобланиши мумкин.'},
    {name:'Бошқалар',price:0,unit:'келишилади',desc:'Мижоз эҳтиёжига қараб хизмат тури, иш ҳажми ва нархи келишилади.'}
  ];
  window.UYGA_SERVICES=SERVICES;
  window.UYGA_PROMO={firstOrderDiscount:10,referralBonus:20000,repeatBonus:5};

  function money(n){return Number(n||0).toLocaleString('ru-RU')+' сўм';}
  function render(){
    const box=document.getElementById('services');
    if(!box)return;
    box.innerHTML=SERVICES.map((s,i)=>`<div class="card"><div style="font-size:28px">${['🧹','🧺','🧼','🛒','📦','🔧','❄️','🔌','🪑','🌿','🚛','🛠️'][i]}</div><h3>${s.name}</h3><div class="price">${s.price>0?money(s.price):'Келишилади'} <span class="small">${s.unit}</span></div><p class="mut small">${s.desc}</p><button type="button" class="cta" onclick="window.chooseService&&window.chooseService(${i})">Буюртма бериш</button></div>`).join('');

    const select=document.getElementById('service');
    if(select){
      select.innerHTML=SERVICES.map((s,i)=>`<option value="${i}">${s.name} — ${s.price>0?money(s.price):'Келишилади'}</option>`).join('');
    }
  }

  function installAdminGpsPanel(){
    const admin=document.getElementById('admin'), orders=document.getElementById('adminOrders');
    if(!admin||!orders||admin.classList.contains('hidden'))return;
    if(document.getElementById('adminGpsEvidence'))return;
    const panel=document.createElement('div');
    panel.id='adminGpsEvidence';
    panel.className='panel';
    panel.style.cssText='margin:0 0 12px;padding:14px;border-radius:16px;background:#eef8f6;border:1px solid #cfe4df;';
    panel.innerHTML='<div style="font-weight:900;font-size:16px">📍 Ходим GPS далили</div><div id="adminGpsEvidenceMeta" style="margin-top:5px;font-size:12px;color:#66807d">GPS сақланган ташрифлар: 0</div><div id="adminGpsEvidenceBody" style="margin-top:8px;color:#526966">Маълумот олинмоқда...</div>';
    orders.parentNode.insertBefore(panel,orders);
    refreshAdminGpsPanel();
  }

  async function refreshAdminGpsPanel(){
    const body=document.getElementById('adminGpsEvidenceBody');
    const meta=document.getElementById('adminGpsEvidenceMeta');
    if(!body||typeof window.api!=='function')return;
    try{
      const data=await window.api('/api/orders');
      const rows=Array.isArray(data)?data:(data&&data.orders)||[];
      const gpsRows=rows.filter(o=>o.workerGps&&Number.isFinite(Number(o.workerGps.lat))&&Number.isFinite(Number(o.workerGps.lon)));
      if(meta)meta.innerHTML='GPS сақланган ташрифлар: <b>'+gpsRows.length+'</b>';
      if(!gpsRows.length){body.innerHTML='Ҳозирча ходимдан GPS далили сақланмаган.';return;}
      body.innerHTML=gpsRows.map(o=>{
        const g=o.workerGps, tm=o.worker_time||'';
        const when=tm?new Date(tm).toLocaleString('uz-UZ',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'вақт кўрсатилмаган';
        const map='https://www.google.com/maps?q='+encodeURIComponent(g.lat+','+g.lon);
        const status=String(o.status||'').replace(/[&<>]/g,'');
        const service=String(o.service||'').replace(/[&<>]/g,'');
        return '<div style="padding:9px 0;border-top:1px solid #d5e7e3"><b>'+String(o.id||'').replace(/[&<>]/g,'')+'</b> — '+String(o.name||'').replace(/[&<>]/g,'')+'<br>🛠 '+service+'<br>📌 '+status+'<br>📍 '+Number(g.lat).toFixed(7)+', '+Number(g.lon).toFixed(7)+'<br>🕐 '+when+'<br><a href="'+map+'" target="_blank" rel="noopener" style="color:#087f79;font-weight:900">🗺 Харитада очиш</a></div>';
      }).join('');
    }catch(e){body.innerHTML='GPS маълумотини олишда хато. Админ кабинетига қайта киринг.';if(meta)meta.textContent='GPS далилларини янгилаб бўлмади';}
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

/* ORDER PRICE SYNC — keep the order modal and submitted order on the same current price list. */
(function(){
  const SERVICES=window.UYGA_SERVICES||[];
  const icons=['🧹','🧺','🧼','🛒','📦','🔧','❄️','🔌','🪑','🌿','🚛','🛠️'];
  window.UYGA_CURRENT_GPS={lat:null,lon:null};

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  function install(){
    const select=document.getElementById('service');
    if(select){
      select.innerHTML=SERVICES.map((s,i)=>`<option value="${i}">${icons[i]||''} ${s.name} — ${s.price>0?Number(s.price).toLocaleString('ru-RU')+' сўм':'Келишилади'}</option>`).join('');
    }

    window.chooseService=function(index){
      if(typeof window.openOrder==='function') window.openOrder();
      const el=document.getElementById('service');
      if(el)el.value=String(index);
    };

    window.getOrderGPS=function(){
      const text=document.getElementById('orderGpsText');
      if(!navigator.geolocation){if(text)text.textContent='Бу браузер GPS ни қўлламайди.';return;}
      if(text)text.textContent='GPS олинмоқда...';
      navigator.geolocation.getCurrentPosition(position=>{
        window.UYGA_CURRENT_GPS={lat:position.coords.latitude,lon:position.coords.longitude};
        if(text)text.textContent=`GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      },()=>{if(text)text.textContent='GPS рухсати берилмади.'},{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    };

    window.createOrder=async function(){
      const select=document.getElementById('service');
      const serviceIndex=Number(select&&select.value||0);
      const service=SERVICES[serviceIndex]||SERVICES[0];
      const name=(document.getElementById('name')?.value||'').trim();
      const phone=(document.getElementById('phone')?.value||'').trim();
      const address=(document.getElementById('address')?.value||'').trim();
      const date=document.getElementById('date')?.value||'';
      const time=document.getElementById('time')?.value||'';
      const note=(document.getElementById('note')?.value||'').trim();
      const message=document.getElementById('orderMessage');

      if(!name||!phone||!address){
        if(message)message.innerHTML='<div class="error">Исм, телефон ва манзилни киритинг.</div>';
        return;
      }

      const id='UY-'+String(Date.now()).slice(-6);
      const gps=window.UYGA_CURRENT_GPS||{};
      try{
        const result=await window.api('/api/orders',{method:'POST',body:JSON.stringify({
          id,service:service.name,price:service.price,name,phone,address,date,time,note,
          gps:gps.lat&&gps.lon?`${gps.lat},${gps.lon}`:'',lat:gps.lat||null,lon:gps.lon||null
        })});
        if(message)message.innerHTML=`<div class="success">Буюртма қабул қилинди.<br>Буюртма рақами: <b>${typeof window.escapeHtml==='function'?window.escapeHtml(result.id||id):(result.id||id)}</b></div>`;
        const trackId=document.getElementById('trackId');
        if(trackId)trackId.value=result.id||id;
        setTimeout(()=>{if(typeof window.closeOrder==='function')window.closeOrder();},1800);
      }catch(error){
        if(message)message.innerHTML=`<div class="error">${typeof window.escapeHtml==='function'?window.escapeHtml(error.message):error.message}</div>`;
      }
    };
  }

  ready(install);
})();