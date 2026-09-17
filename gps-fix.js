// UYGA YORDAM — complete mobile / worker / GPS fix
(function(){
  'use strict';
  var selectedWorkerOrderId=null;

  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]})}

  function injectFix(){
    if(document.getElementById('uyga-complete-fix')) return;
    var s=document.createElement('style'); s.id='uyga-complete-fix';
    s.textContent=`
      body{min-height:100vh!important;background:#f5faf9!important;}
      main{min-height:100vh!important;}
      .wrap{min-height:100vh!important;}
      .section,.panel,.card{position:relative;z-index:1;}
      .home-control{display:none!important;}
      body:has(#home.promo-home:not(.hidden)) .home-control{display:flex!important;}
      #modal,.modal{z-index:2000000!important;}
      #modal .modalbox,.modal .modalbox{position:relative!important;z-index:2000001!important;max-height:calc(100vh - 24px)!important;overflow:auto!important;}
      .modal.hidden{display:none!important;}

      @media(max-width:700px){
        html,body{width:100%;min-width:0;overflow-x:hidden!important;}
        .wrap{width:100%!important;max-width:none!important;padding:10px 10px 24px!important;}
        body:not(:has(#home.promo-home:not(.hidden))) .wrap{padding-bottom:24px!important;}

        /* STEP 1 — only the inner mobile panels: balanced width, spacing and hierarchy. */
        .section{margin-top:16px!important;}
        .section h2,#worker h2,#admin h2,#track h2{font-size:22px!important;line-height:1.2!important;margin:4px 0 11px!important;}
        .panel,.card{width:100%!important;box-sizing:border-box!important;border-radius:16px!important;padding:13px!important;}
        .grid2,.hero,.order{grid-template-columns:1fr!important;gap:10px!important;}
        .cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
        .cards .card{min-height:0!important;padding:11px!important;}
        .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
        .stats .card{padding:11px!important;}
        .actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin-top:10px!important;}
        .actions button{width:100%!important;min-height:46px!important;border-radius:12px!important;}
        input,select,textarea{width:100%!important;min-height:45px!important;box-sizing:border-box!important;border-radius:11px!important;}
        .field{margin:7px 0!important;}
        .field label{display:block!important;margin-bottom:4px!important;font-size:12px!important;}
        #workerOrders,#adminOrders,#trackResult{width:100%!important;}
        #workerOrders .panel,#adminOrders .panel{overflow:visible!important;}
        #workerOrders p,#adminOrders p,#trackResult p{word-break:break-word!important;line-height:1.42!important;}

        body:has(#home.promo-home:not(.hidden)) .wrap{padding-bottom:94px!important;}
        /* STEP 4 — only the three fixed home controls: equal visual weight, cleaner tap targets. */
        .home-control{left:7px!important;right:7px!important;bottom:7px!important;transform:none!important;width:auto!important;max-width:none!important;display:grid!important;grid-template-columns:1.2fr 1fr 1fr!important;gap:6px!important;padding:6px!important;border-radius:17px!important;z-index:9000!important;box-sizing:border-box!important;}
        .home-control button{min-width:0!important;min-height:50px!important;padding:7px 4px!important;font-size:11px!important;line-height:1.15!important;white-space:normal!important;border-radius:13px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;}
        .home-control button span{display:block!important;margin:0!important;font-size:18px!important;line-height:1!important;}

        /* STEP 2 — preserve the home artwork aspect ratio; do not stretch the image. */
        .promo-home{width:100vw!important;margin-left:calc(50% - 50vw)!important;overflow:hidden!important;background:#fff!important;}
        .promo-art{position:relative!important;width:100vw!important;height:auto!important;min-height:0!important;max-height:none!important;background:#fff!important;overflow:hidden!important;}
        .promo-art>img{width:100vw!important;height:auto!important;min-height:0!important;max-height:none!important;object-fit:initial!important;display:block!important;margin:0!important;border-radius:0!important;}
        .promo-hotspot{z-index:5!important;}
        .promo-service{width:12.7%!important;height:13.5%!important;}
        .promo-service.s0{left:1.5%!important}.promo-service.s1{left:15.9%!important}.promo-service.s2{left:30.3%!important}.promo-service.s3{left:44.7%!important}.promo-service.s4{left:59.1%!important}.promo-service.s5{left:73.5%!important}
        .promo-service.s6{left:1.5%!important;top:59%!important}.promo-service.s7{left:15.9%!important;top:59%!important}.promo-service.s8{left:30.3%!important;top:59%!important}.promo-service.s9{left:44.7%!important;top:59%!important}.promo-service.s10{left:59.1%!important;top:59%!important}.promo-service.s11{left:73.5%!important;top:59%!important}

        /* STEP 3 — only the social block: compact, balanced and easy to tap. */
        .social-hub{width:calc(100% - 20px)!important;margin:16px auto 26px!important;padding:16px 12px!important;border-radius:18px!important;box-sizing:border-box!important;}
        .social-title{font-size:18px!important;line-height:1.25!important;}
        .social-sub{font-size:12px!important;line-height:1.4!important;margin-top:5px!important;}
        .social-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important;}
        .social-btn{min-width:0!important;min-height:48px!important;padding:8px 6px!important;box-sizing:border-box!important;border-radius:13px!important;font-size:12px!important;gap:6px!important;}
        .social-btn span:first-child{font-size:18px!important;}

        /* STEP 5 — only inner worker/admin/track screens. */
        #worker,#admin,#track{padding-top:2px!important;}
        #worker .panel,#admin .panel,#track .panel{box-shadow:0 6px 20px #103d370c!important;}
        #worker .stats,#admin .stats{margin-bottom:10px!important;}
        #worker .stats .card,#admin .stats .card{min-height:72px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}
        #worker .stat b,#admin .stat b{font-size:23px!important;line-height:1.1!important;margin-bottom:3px!important;}
        #workerOrders .order-card,#adminOrders .order-card{padding:12px!important;margin:0 0 9px!important;border-radius:15px!important;box-shadow:0 5px 16px #103d370b!important;}
        #workerOrders .order-card:last-child,#adminOrders .order-card:last-child{margin-bottom:0!important;}
        #workerOrders .order,#adminOrders .order{gap:9px!important;}
        #workerOrders .order h3,#adminOrders .order h3{font-size:16px!important;line-height:1.3!important;margin:0 0 5px!important;}
        #workerOrders .status,#adminOrders .status{font-size:11px!important;padding:5px 8px!important;}
        #workerOrders .actions,#adminOrders .actions{margin-top:8px!important;}
        #workerOrders .actions button,#adminOrders .actions button{min-height:44px!important;}
        #workerMessage,#adminMessage,#trackResult{margin-top:9px!important;}
        .worker-gps-box{padding:11px!important;border-radius:14px!important;}
        #worker .notice,#admin .notice,#track .notice{padding:11px!important;border-radius:13px!important;line-height:1.45!important;}
        #worker .error,#admin .error,#track .error,#worker .success,#admin .success,#track .success{padding:11px!important;border-radius:13px!important;line-height:1.45!important;}

        .modal{padding:8px!important;align-items:flex-start!important;}
        .modalbox{width:100%!important;max-width:none!important;margin:0!important;max-height:calc(100svh - 16px)!important;padding:14px!important;border-radius:18px!important;}
        .modalbox .actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;}
        .modalbox .actions button{width:100%!important;min-height:48px!important;}
      }

      @media(min-width:701px){
        .promo-home{width:100vw!important;margin-left:calc(50% - 50vw)!important;overflow:hidden!important;}
        .promo-art{width:100vw!important;height:calc(100vh - 1px)!important;min-height:620px!important;overflow:hidden!important;}
        .promo-art>img{width:100vw!important;height:100%!important;object-fit:fill!important;display:block!important;border-radius:0!important;}
      }

      body:not(:has(#home.promo-home:not(.hidden))) .social-hub{display:none!important;}
      body:not(:has(#home.promo-home:not(.hidden))) .home-control{display:none!important;}
      body:not(:has(#home.promo-home:not(.hidden))) .top{position:sticky!important;z-index:100!important;}

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
    window.startWork=async function(){try{await setStatus('Бажарилмоқда');}catch(e){var m=document.getElementById('workerMessage');if(m)m.innerHTML='<div class="error">'+esc(e.message)+'</div>';}};
    window.finishWork=async function(){try{await setStatus('Тугади');}catch(e){var m=document.getElementById('workerMessage');if(m)m.innerHTML='<div class="error">'+esc(e.message)+'</div>';}};
    window.updateWorkerOrderStatus=setStatus;
    window.getGPS=async function(){var t=document.getElementById('gpsText');if(t)t.textContent='GPS олинмоқда...';try{var g=await readGps();showGps(g);return g;}catch(e){var st=document.getElementById('gpsState');if(st)st.textContent='Йўқ';if(t)t.textContent=e.message;return null;}};
  }

  function installSelection(){
    if(typeof window.selectWorkerOrder==='function' && !window.selectWorkerOrder.__uygaFixed){var old=window.selectWorkerOrder;window.selectWorkerOrder=function(id){selectedWorkerOrderId=id;return old.apply(this,arguments);};window.selectWorkerOrder.__uygaFixed=true;}
  }

  function installPolling(){
    if(window.__uygaPoll)return;
    window.__uygaPoll=setInterval(function(){try{var w=document.getElementById('worker'),a=document.getElementById('admin');if(w&&!w.classList.contains('hidden')&&typeof window.loadWorkerOrders==='function')window.loadWorkerOrders();if(a&&!a.classList.contains('hidden')&&typeof window.loadOrders==='function')window.loadOrders();}catch(e){}},5000);
  }

  function install(){injectFix();installSelection();installWorkerButtons();installPolling();setTimeout(function(){installSelection();installWorkerButtons();installPolling();},500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();