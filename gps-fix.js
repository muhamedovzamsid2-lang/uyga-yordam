// UYGA YORDAM — real worker GPS -> server binding
(function(){
  function readGps(){
    return new Promise(function(resolve,reject){
      if(!navigator.geolocation) return reject(new Error('Браузер GPS ни қўлламайди.'));
      navigator.geolocation.getCurrentPosition(
        function(pos){
          var lat=pos.coords.latitude, lon=pos.coords.longitude;
          if(!Number.isFinite(lat)||!Number.isFinite(lon)) return reject(new Error('GPS координатаси олинмади.'));
          resolve({lat:lat,lon:lon});
        },
        function(){ reject(new Error('GPS рухсати берилмади. Телефонда Location → Allow қилинг.')); },
        {enableHighAccuracy:true,timeout:15000,maximumAge:0}
      );
    });
  }

  window.addEventListener('DOMContentLoaded',function(){
    if(typeof window.updateWorkerOrderStatus!=='function') return;
    var original=window.updateWorkerOrderStatus;
    window.updateWorkerOrderStatus=async function(status){
      var gps=await readGps();
      var id=window.activeOrderId;
      if(!id && Array.isArray(window.orders)){
        var available=window.orders.find(function(o){return o.status!=='Тугади';});
        if(available) id=available.id;
      }
      if(!id) throw new Error('Буюртма танланмаган.');
      await window.api('/api/orders/'+encodeURIComponent(id),{
        method:'PATCH',
        body:JSON.stringify({status:status,lat:gps.lat,lon:gps.lon})
      });
      if(Array.isArray(window.orders)){
        var local=window.orders.find(function(o){return o.id===id;});
        if(local){local.status=status;local.workerGps={lat:gps.lat,lon:gps.lon};local.workerTime=new Date().toISOString();}
      }
      if(typeof window.renderWorkerOrders==='function') window.renderWorkerOrders();
      var text=document.getElementById('gpsText');
      var state=document.getElementById('gpsState');
      if(state) state.textContent='Бор';
      if(text) text.textContent='GPS: '+gps.lat.toFixed(6)+', '+gps.lon.toFixed(6);
    };
  });
})();
