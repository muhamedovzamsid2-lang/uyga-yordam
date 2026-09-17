// UYGA YORDAM — complete mobile / worker / GPS fix
(function(){
  'use strict';
  var selectedWorkerOrderId=null;

  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]})}

  function injectFix(){
    if(document.getElementById('uyga-complete-fix')) return;
    var s=document.createElement('style'); s.id='uyga-complete-fix';
    s.textContent=`
      /* Universal page shell */
      body{min-height:100vh!important;background:#f5faf9!important;}
      main{min-height:100vh!important;}
      .wrap{min-height:100vh!important;}
      .section,.panel,.card{position:relative;z-index:1;}

      /* Never let the fixed home menu cover dialogs or important controls */
      .home-control{z-index:9000!important;}
      #modal,.modal{z-index:2000000!important;}
      #modal .modalbox,.modal .modalbox{position:relative!important;z-index:2000001!important;max-height:calc(100vh - 24px)!important;overflow:auto!important;}
      .modal.hidden{display:none!important;}

      /* Phone: use the whole width and make every page readable */
      @media(max-width:700px){
        html,body{width:100%;min-width:0;overflow-x:hidden!important;}
        .wrap{width:100%!important;max-width:none!important;padding:10px 10px 118px!important;}
        .panel,.card{width:100%!important;border-radius:16px!important;padding:13px!important;}
        .grid2,.hero,.order{grid-template-columns:1fr!important;}
        .cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;}
        .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
        .actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;}
        .actions button{width:100%!important;min-height:46px!important;}
        input,select,textarea{width:100%!important;min-height:45px!important;}
        #worker h2,#admin h2,#track h2{font-size:23px!important;line-height:1.2!important;margin:6px 0 13px!important;}
        #workerOrders,#adminOrders,#trackResult{width:100%!important;}
        #workerOrders .panel,#adminOrders .panel{overflow:visible!important;}
        #workerOrders p,#adminOrders p,#trackResult p{word-break:break-word!important;line-height:1.45!important;}
        .home-control{left:5px!important;right:5px!important;bottom:5px!important;transform:none!important;width:auto!important;max-width:none!important;display:grid!important;grid-template-columns:1.5fr 1fr 1fr!important;gap:4px!important;padding:5px!important;border-radius:15px!important;}
        .home-control button{min-width:0!important;min-height:48px!important;padding:7px 3px!important;font-size:11px!important;line-height:1.15!important;white-space:normal!important;}
        .home-control button span{display:block!important;margin:0 0 2px!important;font-size:18px!important;}

        /* Home artwork: fill a useful mobile area instead of appearing tiny */
        .promo-home{width:100%!important;overflow:hidden!important;}
        .promo-art{width:100%!important;min-height:500px!important;background:#fff!important;}
        .promo-art>img{width:100%!important;height:500px!important;object-fit:fill!important;display:block!important;}
        .promo-hotspot{z-index:5!important;}
        .promo-service{width:12.7%!important;height:13.5%!important;}
        .promo-service.s0{left:1.5%!important}.promo-service.s1{left:15.9%!important}.promo-service.s2{left:30.3%!important}.promo-service.s3{left:44.7%!important}.promo-service.s4{left:59.1%!important}.promo-service.s5{left:73.5%!important}
        .promo-service.s6{left:1.5%!important;top:59%!important}.promo-service.s7{left:15.9%!important;top:59%!important}.promo-service.s8{left:30.3%!important;top:59%!important}.promo-service.s9{left:44.7%!important;top:59%!important}.promo-service.s10{left:59.1%!important;top:59%!important}.promo-service.s11{left:73.5%!important;top:59%!important}
        .social-hub{width:calc(100% - 16px)!important;margin:14px auto 128px!important;padding:14px 10px!important;border-radius:18px!important;}
        .social-grid{grid-template-columns:repeat(2,1fr)!important;gap:7px!important;}
        .social-btn{min-height:46px!important;font-size:12px!important;}
        .social-title{font-size:18px!important;}
        .social-sub{font-size:12px!important;}
      }

      .worker-gps-box{margin-top:10px;padding:12px;border-radius:13px;background:#eef8f6;border:1px solid #cfe4df;line-height:1.55;}
      .worker-gps-box a{display:inline-block;margin-top:6px;color:#087f79;font-weight:900;text-decoration:none;}
      .worker-gps-accuracy{font-size:12px;color:#5f7471;}
      .gps-live-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#18a060;margin-right:5px;}
    `;
    document.head.appendChild(s);
  }

  function readGps(){
    return new Promise(function(resolve,reject){
      if(!navigator.geolocation) return reject(new Error('Бу телефон браузери GPS ни қўлламайди.'));
      navigator.geolocation.getCurrentPosition(function(pos){
        var c=pos.coords||{},lat=Number(c.latitude),lon=Number(c.longitude),accuracy=Number(c.accuracy||0);
        if(!Number.isFinite(lat)||!Number.isFinite(lon)) return reject(new Error('Аниқ координата олинмади. Location/GPS ни ёқинг.'));
        resolve({lat:lat,lon:lon,accuracy:accuracy});
      },function(err){
        var m='Location рухсати берилмаган. Телефонда Location → Allow қилинг.';
        if(err&&err.code===2)m='Телефон аниқ жойни топмади. GPS/Location ни ёқиб, очиқ жойда қайта текширинг.';
        if(err&&err.code===3)m='GPS олиш вақти тугади. Қайта текширинг.';
        reject(new Error(m));
      },{enableHighAccuracy:true,timeout:30000,maximumAge:0});
    });
  }

  function showGps(g){
    var st=document.getElementById('gpsState'),tx=document.getElementById('gpsText');
    if(st)st.innerHTML='<span class="gps-live-dot"></span>Бор';
    if(tx)tx.innerHTML='📍 <b>Жорий аниқ координата:</b><br>'+g.lat.toFixed(7)+', '+g.lon.toFixed(7)+(g.accuracy?'<br><span class="worker-gps-accuracy">Аниқлик: ±'+Math.round(g.accuracy)+' м</span>':'')+'<br><a href="https://www.google.com/maps?q='+g.lat+','+g.lon+'" target="_blank" rel="noopener">🗺 Аниқ жойни харитада очиш</a>';
  }

  async function selectedId(){
    if(selectedWorkerOrderId)return selectedWorkerOrderId;
    try{
      var d=await window.api('/api/orders'),a=Array.isArray(d)?d:(d.orders||[]),o=a.find(function(x){return x.status!=='Тугади';})||a[0];
      return o?o.id:null;
    }catch(e){return null;}
  }

  async function setStatus(status){
    var id=await selectedId();
    if(!id)throw new Error('Аввало буюртмада «Танлаш»ни босинг.');
    var gps=await readGps();
    showGps(gps);
    var r=await window.api('/api/orders/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:status,lat:gps.lat,lon:gps.lon})});
    selectedWorkerOrderId=id;
    var ws=document.getElementById('workState'); if(ws)ws.textContent=status==='Бажарилмоқда'?'Ишда':status==='Тугади'?'Тугади':'Тайёр';
    var msg=document.getElementById('workerMessage'); if(msg)msg.innerHTML='<div class="success">Буюртма ҳолати <b>'+esc(status)+'</b> га ўзгартирилди.<br>📍 GPS серверга сақланди.</div>';
    if(typeof window.loadWorkerOrders==='function')await window.loadWorkerOrders();
    return r;
  }

  function installWorkerButtons(){
    /* These replacements use the same selected order ID and therefore bypass the old lexical activeOrderId bug. */
    window.startWork=async function(){
      try{await setStatus('Бажарилмоқда');}catch(e){var m=document.getElementById('workerMessage');if(m)m.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
    };
    window.finishWork=async function(){
      try{await setStatus('Тугади');}catch(e){var m=document.getElementById('workerMessage');if(m)m.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
    };
    window.updateWorkerOrderStatus=setStatus;
    window.getGPS=async function(){var t=document.getElementById('gpsText');if(t)t.textContent='GPS олинмоқда...';try{var g=await readGps();showGps(g);return g;}catch(e){var st=document.getElementById('gpsState');if(st)st.textContent='Йўқ';if(t)t.textContent=e.message;return null;}};
  }

  function installSelection(){
    if(typeof window.selectWorkerOrder==='function' && !window.selectWorkerOrder.__uygaFixed){
      var old=window.selectWorkerOrder;
      window.selectWorkerOrder=function(id){selectedWorkerOrderId=id;return old.apply(this,arguments);};
      window.selectWorkerOrder.__uygaFixed=true;
    }
  }

  function installPolling(){
    if(window.__uygaPoll)return;
    window.__uygaPoll=setInterval(function(){
      try{
        var w=document.getElementById('worker'),a=document.getElementById('admin');
        if(w && !w.classList.contains('hidden') && typeof window.loadWorkerOrders==='function')window.loadWorkerOrders();
        if(a && !a.classList.contains('hidden') && typeof window.loadOrders==='function')window.loadOrders();
      }catch(e){}
    },5000);
  }

  function install(){
    injectFix();
    installSelection();
    installWorkerButtons();
    installPolling();
    /* Retry once after other deferred scripts have attached their functions. */
    setTimeout(function(){installSelection();installWorkerButtons();installPolling();},500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
