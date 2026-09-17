// UYGA YORDAM — worker GPS + mobile UI fix
(function(){
  'use strict';

  var selectedWorkerOrderId = null;

  function injectMobileFix(){
    if(document.getElementById('uyga-mobile-fix')) return;
    var style=document.createElement('style');
    style.id='uyga-mobile-fix';
    style.textContent=`
      /* Fixed bottom menu must never cover order confirmation / modal */
      .home-control{z-index:9000!important;}
      #modal{z-index:999999!important;}
      #modal .modalbox{z-index:1000000!important;}

      /* Phone layout */
      @media(max-width:700px){
        body{overflow-x:hidden!important;}
        .wrap{width:100%!important;max-width:none!important;padding:14px 12px 105px!important;}
        .panel,.card{border-radius:16px!important;padding:14px!important;}
        .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
        .stat b{font-size:21px!important;}
        .actions{gap:7px!important;}
        .actions button{min-height:44px!important;flex:1 1 145px!important;}
        .order{grid-template-columns:1fr!important;gap:10px!important;}
        .order-card{margin-bottom:9px!important;}
        .worker-active{border-width:2px!important;}
        #worker h2,#admin h2,#track h2{font-size:24px!important;margin:8px 0 14px!important;}
        #workerOrders .panel{overflow:hidden!important;}
        #workerOrders p{margin:7px 0!important;word-break:break-word!important;}
        #gpsText{line-height:1.5!important;word-break:break-word!important;}
        .home-control{bottom:7px!important;left:6px!important;right:6px!important;width:auto!important;max-width:none!important;}
        .home-control button{min-height:44px!important;font-size:11px!important;padding:8px 4px!important;}
        .social-hub{margin-bottom:82px!important;}
      }

      .worker-gps-box{margin-top:10px;padding:10px 12px;border-radius:12px;background:#eef8f6;border:1px solid #dcebe8;line-height:1.5;}
      .worker-gps-box a{display:inline-block;margin-top:6px;color:#087f79;font-weight:800;text-decoration:none;}
      .worker-gps-accuracy{color:#66807d;font-size:12px;}
    `;
    document.head.appendChild(style);
  }

  function readGps(){
    return new Promise(function(resolve,reject){
      if(!navigator.geolocation) return reject(new Error('Браузер GPS ни қўлламайди.'));
      navigator.geolocation.getCurrentPosition(
        function(pos){
          var c=pos.coords||{};
          var lat=Number(c.latitude),lon=Number(c.longitude),accuracy=Number(c.accuracy||0);
          if(!Number.isFinite(lat)||!Number.isFinite(lon)) return reject(new Error('Аниқ GPS координатаси олинмади.'));
          resolve({lat:lat,lon:lon,accuracy:accuracy});
        },
        function(err){
          var msg='GPS рухсати берилмади. Телефонда Location → Allow қилинг.';
          if(err&&err.code===2) msg='GPS координатаси аниқланмади. Телефонда Location/GPS ни ёқинг ва очиқ жойда қайта текширинг.';
          if(err&&err.code===3) msg='GPS олиш вақти тугади. Қайтадан GPS текширишни босинг.';
          reject(new Error(msg));
        },
        {enableHighAccuracy:true,timeout:20000,maximumAge:0}
      );
    });
  }

  function showGps(gps){
    var state=document.getElementById('gpsState');
    var text=document.getElementById('gpsText');
    if(state) state.textContent='Бор';
    if(text){
      text.innerHTML='📍 <b>Аниқ GPS:</b> '+gps.lat.toFixed(6)+', '+gps.lon.toFixed(6)+
        (gps.accuracy ? '<br><span class="worker-gps-accuracy">Аниқлик: ±'+Math.round(gps.accuracy)+' м</span>' : '')+
        '<br><a href="https://www.google.com/maps?q='+gps.lat+','+gps.lon+'" target="_blank" rel="noopener">🗺 Харитада аниқ жойни очиш</a>';
    }
  }

  async function findOrderId(){
    if(selectedWorkerOrderId) return selectedWorkerOrderId;
    try{
      var data=await window.api('/api/orders');
      var list=Array.isArray(data)?data:(data.orders||[]);
      var order=list.find(function(o){return o.status!=='Тугади';})||list[0];
      return order?order.id:null;
    }catch(e){return null;}
  }

  async function fixedUpdateStatus(status){
    var id=await findOrderId();
    if(!id) throw new Error('Буюртма танланмаган. Аввало буюртмада «Танлаш»ни босинг.');

    var gps=await readGps();
    showGps(gps);

    await window.api('/api/orders/'+encodeURIComponent(id),{
      method:'PATCH',
      body:JSON.stringify({status:status,lat:gps.lat,lon:gps.lon})
    });

    selectedWorkerOrderId=id;

    var state=document.getElementById('workState');
    if(state) state.textContent=status==='Бажарилмоқда'?'Ишда':(status==='Тугади'?'Тугади':'Тайёр');

    var message=document.getElementById('workerMessage');
    if(message){
      message.innerHTML='<div class="success">Буюртма <b>'+String(status).replaceAll('<','&lt;')+'</b> ҳолатига ўзгартирилди.<br>📍 GPS серверга сақланди.</div>';
    }

    if(typeof window.loadWorkerOrders==='function') await window.loadWorkerOrders();
    return true;
  }

  window.addEventListener('DOMContentLoaded',function(){
    injectMobileFix();

    /* Keep the selected order ID because top-level let variables are not window properties. */
    if(typeof window.selectWorkerOrder==='function'){
      var originalSelect=window.selectWorkerOrder;
      window.selectWorkerOrder=function(id){
        selectedWorkerOrderId=id;
        return originalSelect.apply(this,arguments);
      };
    }

    /* Replace the broken status/GPS binding with one that always sends coordinates. */
    window.updateWorkerOrderStatus=fixedUpdateStatus;

    /* Show a real, current GPS position in the worker panel. */
    window.getGPS=async function(){
      var text=document.getElementById('gpsText');
      if(text) text.textContent='GPS олинмоқда...';
      try{
        var gps=await readGps();
        showGps(gps);
        return gps;
      }catch(e){
        var state=document.getElementById('gpsState');
        if(state) state.textContent='Йўқ';
        if(text) text.textContent=e.message;
        return null;
      }
    };

    /* Keep order tracking visually tied to the exact worker GPS. */
    if(typeof window.track==='function'){
      var originalTrack=window.track;
      window.track=async function(){
        await originalTrack.apply(this,arguments);
        try{
          var id=document.getElementById('trackId').value.trim();
          if(!id) return;
          var data=await window.api('/api/orders/'+encodeURIComponent(id));
          var o=data.order||data;
          if(o.worker_lat!=null && o.worker_lon!=null){
            var box=document.getElementById('trackResult');
            if(box){
              box.insertAdjacentHTML('beforeend','<div class="worker-gps-box">📍 <b>Ходимнинг аниқ келган жойи:</b> '+Number(o.worker_lat).toFixed(6)+', '+Number(o.worker_lon).toFixed(6)+'<br><a href="https://www.google.com/maps?q='+Number(o.worker_lat)+','+Number(o.worker_lon)+'" target="_blank" rel="noopener">🗺 Харитада очиш</a>'+(o.worker_time?'<br><span class="worker-gps-accuracy">Вақт: '+new Date(o.worker_time).toLocaleString('uz-UZ')+'</span>':'')+'</div>');
            }
          }
        }catch(e){}
      };
    }
  });
})();
