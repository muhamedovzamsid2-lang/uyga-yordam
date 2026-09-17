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
  window.UYGA_PRICE_FORMAT=money;
  window.addEventListener('DOMContentLoaded',render);
})();
