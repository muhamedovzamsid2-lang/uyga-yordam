// UYGA YORDAM production server
const http=require('http'), fs=require('fs'), path=require('path'), crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const ROOT=__dirname;
const PORT=Number(process.env.PORT||3000);
const db=new DatabaseSync(path.join(ROOT,'uyga.db'));

db.exec(`CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY,
  service TEXT,
  price INTEGER,
  name TEXT,
  phone TEXT,
  address TEXT,
  date TEXT,
  time TEXT,
  note TEXT,
  lat REAL,
  lon REAL,
  status TEXT,
  created TEXT
);`);

const ADMIN_USER=process.env.ADMIN_USER||'admin';
const ADMIN_PASS=process.env.ADMIN_PASS||'admin123';
const WORKER_USER=process.env.WORKER_USER||'worker';
const WORKER_PASS=process.env.WORKER_PASS||'worker123';
const SECRET=process.env.AUTH_SECRET||'uyga-yordam-change-me';

function json(res,code,obj){
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}

function body(req){
  return new Promise((ok,fail)=>{
    let d='';
    req.on('data',c=>{
      d+=c;
      if(d.length>1e6){req.destroy(); fail(new Error('Request too large'));}
    });
    req.on('end',()=>{
      try{ok(d?JSON.parse(d):{})}catch(e){fail(e)}
    });
    req.on('error',fail);
  });
}

function token(roleName){
  const exp=Date.now()+12*3600e3;
  const p=`${roleName}.${exp}`;
  const sig=crypto.createHmac('sha256',SECRET).update(p).digest('hex');
  return `${p}.${sig}`;
}

function role(req){
  const t=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  const [r,e,s]=t.split('.');
  if(!r||!e||!s||!/^\d+$/.test(e)||+e<Date.now())return null;
  const expected=crypto.createHmac('sha256',SECRET).update(`${r}.${e}`).digest('hex');
  const a=Buffer.from(s),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b)?r:null;
}

function rows(){
  return db.prepare('SELECT * FROM orders ORDER BY created DESC').all().map(o=>({...o,gps:o.lat==null?null:{lat:o.lat,lon:o.lon}}));
}

function originalHome(html){
  const home=`<section id="home" class="promo-home">
    <div class="promo-art">
      <img src="hero.png" alt="UYGA YORDAM — хизматлар платформаси">
      <button class="promo-hotspot promo-main-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button>
      <button class="promo-hotspot promo-phone-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button>
      <button class="promo-hotspot promo-bottom-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button>
      <button class="promo-hotspot promo-service s0" type="button" aria-label="Уй тозалаш" onclick="chooseService(0)"></button>
      <button class="promo-hotspot promo-service s1" type="button" aria-label="Кир ювиш" onclick="chooseService(1)"></button>
      <button class="promo-hotspot promo-service s2" type="button" aria-label="Диван ва матрас" onclick="chooseService(2)"></button>
      <button class="promo-hotspot promo-service s3" type="button" aria-label="Бозор" onclick="chooseService(3)"></button>
      <button class="promo-hotspot promo-service s4" type="button" aria-label="Курьер" onclick="chooseService(4)"></button>
      <button class="promo-hotspot promo-service s5" type="button" aria-label="Сантехник" onclick="chooseService(5)"></button>
      <button class="promo-hotspot promo-service s6" type="button" aria-label="Кондиционер" onclick="chooseService(6)"></button>
      <button class="promo-hotspot promo-service s7" type="button" aria-label="Маиший техника" onclick="chooseService(7)"></button>
      <button class="promo-hotspot promo-service s8" type="button" aria-label="Мебель" onclick="chooseService(8)"></button>
      <button class="promo-hotspot promo-service s9" type="button" aria-label="Богбон" onclick="chooseService(9)"></button>
      <button class="promo-hotspot promo-service s10" type="button" aria-label="Юк ташиш" onclick="chooseService(10)"></button>
      <button class="promo-hotspot promo-service s11" type="button" aria-label="Бошка хизматлар" onclick="chooseService(11)"></button>
    </div>
    <div id="services" class="hidden"></div>
  </section>
  <div class="home-control" aria-label="Платформа менюси">
    <button type="button" onclick="show('track')"><span>🔎</span> Буюртмани текшириш</button>
    <button type="button" onclick="show('worker')"><span>👷</span> Ходим</button>
    <button type="button" onclick="show('admin')"><span>📊</span> Админ</button>
  </div>`;

  const css=`<style id="original-uyga-design">
    body:has(#home.promo-home:not(.hidden)) .top,
    body:has(#home.promo-home:not(.hidden)) .footer{display:none!important}
    .wrap:has(#home.promo-home:not(.hidden)){max-width:none!important;padding:0!important}
    .promo-home{margin:0;width:100%;background:#fff}
    .promo-art{position:relative;width:100%;line-height:0;overflow:hidden}
    .promo-art>img{display:block;width:100%;height:auto;margin:0;border-radius:0;box-shadow:none;user-select:none}
    .promo-hotspot{position:absolute;display:block;padding:0;margin:0;border:0;background:transparent;cursor:pointer;z-index:2}
    .promo-hotspot:focus-visible{outline:3px solid #12a58c;outline-offset:2px;border-radius:18px}
    .promo-main-order{left:2.2%;top:30.5%;width:18%;height:4.2%}
    .promo-phone-order{left:75.5%;top:15.5%;width:11%;height:3.5%}
    .promo-bottom-order{left:68.2%;top:87.5%;width:18.2%;height:4.5%}
    .promo-service{width:10.9%;height:10.9%;top:45.8%}
    .promo-service.s0{left:2.2%}.promo-service.s1{left:14.1%}.promo-service.s2{left:26.0%}.promo-service.s3{left:37.9%}.promo-service.s4{left:49.8%}.promo-service.s5{left:61.8%}
    .promo-service.s6{left:2.2%;top:58.2%}.promo-service.s7{left:14.1%;top:58.2%}.promo-service.s8{left:26.0%;top:58.2%}.promo-service.s9{left:37.9%;top:58.2%}.promo-service.s10{left:49.8%;top:58.2%}.promo-service.s11{left:61.8%;top:58.2%}
    .home-control{position:fixed;right:18px;top:18px;z-index:10000;display:flex;gap:8px;align-items:center;max-width:min(760px,calc(100vw - 36px));padding:7px;border:1px solid rgba(255,255,255,.7);border-radius:18px;background:rgba(255,255,255,.92);box-shadow:0 10px 35px rgba(0,0,0,.16);backdrop-filter:blur(10px)}
    .home-control button{padding:10px 13px;border-radius:12px;background:#eef8f6;color:#087f79;font-weight:800;white-space:nowrap;box-shadow:inset 0 0 0 1px #dcebe8}
    .home-control button:hover{background:#087f79;color:#fff}
    .home-control span{margin-right:3px}
    @media(max-width:700px){
      .promo-main-order{left:2%;width:18%;height:4.5%}
      .promo-phone-order{left:75%;width:12%;height:4%}
      .promo-bottom-order{left:68%;width:19%;height:4.5%}
      .home-control{left:8px;right:8px;top:8px;max-width:none;justify-content:center;gap:5px;padding:5px;border-radius:15px}
      .home-control button{flex:1;padding:9px 6px;font-size:12px}
      .home-control button:first-child{flex:1.5}
    }
  </style>`;

  const start=html.indexOf('<section id="home"');
  if(start<0)return html;
  const end=html.indexOf('</section>',start);
  if(end<0)return html;
  const replaced=html.slice(0,start)+home+html.slice(end+'</section>'.length);
  return replaced.includes('class="promo-home"')?replaced.replace('</head>',css+'</head>'):html;
}

const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://x');

    if(req.method==='POST'&&u.pathname==='/api/login'){
      const b=await body(req);
      const r=(b.username===ADMIN_USER&&b.password===ADMIN_PASS)?'admin':(b.username===WORKER_USER&&b.password===WORKER_PASS)?'worker':null;
      return r?json(res,200,{token:token(r),role:r}):json(res,401,{error:'Нотўғри логин ёки парол'});
    }

    if(req.method==='POST'&&u.pathname==='/api/orders'){
      const b=await body(req);
      if(!b.id||!b.name||!b.phone||!b.address)return json(res,400,{error:'Маълумот етарли эмас'});
      if(!/^UY-[A-Z0-9-]{6,20}$/.test(String(b.id)))return json(res,400,{error:'Нотўғри буюртма рақами'});
      const exists=db.prepare('SELECT id FROM orders WHERE id=?').get(b.id);
      if(exists)return json(res,409,{error:'Бу буюртма рақами аллақачон мавжуд'});
      db.prepare(`INSERT INTO orders(id,service,price,name,phone,address,date,time,note,lat,lon,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(b.id,b.service||'',Number(b.price)||0,b.name,b.phone,b.address,b.date||'',b.time||'',b.note||'',Number.isFinite(Number(b.lat))?Number(b.lat):null,Number.isFinite(Number(b.lon))?Number(b.lon):null,'Янги',new Date().toISOString());
      return json(res,201,{ok:true,id:b.id});
    }

    if(req.method==='GET'&&u.pathname.startsWith('/api/orders/')){
      const id=decodeURIComponent(u.pathname.split('/').pop());
      const o=db.prepare('SELECT * FROM orders WHERE id=?').get(id);
      if(!o)return json(res,404,{error:'Топилмади'});
      return json(res,200,{...o,gps:o.lat==null?null:{lat:o.lat,lon:o.lon}});
    }

    if(req.method==='GET'&&u.pathname==='/api/orders'){
      const r=role(req);
      if(r!=='admin'&&r!=='worker')return json(res,401,{error:'Кириш керак'});
      return json(res,200,rows());
    }

    if(req.method==='PATCH'&&u.pathname.startsWith('/api/orders/')){
      const r=role(req);
      if(r!=='admin'&&r!=='worker')return json(res,403,{error:'Рухсат йўқ'});
      const id=decodeURIComponent(u.pathname.split('/').pop());
      const b=await body(req);
      const allowed=['Янги','Ходим бириктирилди','Йўлда','Бажарилмоқда','Тугади'];
      if(!allowed.includes(b.status))return json(res,400,{error:'Нотўғри ҳолат'});
      const found=db.prepare('SELECT id FROM orders WHERE id=?').get(id);
      if(!found)return json(res,404,{error:'Буюртма топилмади'});
      db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status,id);
      return json(res,200,{ok:true});
    }

    if(req.method==='DELETE'&&u.pathname==='/api/orders'){
      if(role(req)!=='admin')return json(res,403,{error:'Рухсат йўқ'});
      db.exec('DELETE FROM orders');
      return json(res,200,{ok:true});
    }

    if(req.method==='GET'&&u.pathname==='/health')return json(res,200,{ok:true});

    const p=u.pathname==='/'?'index.html':u.pathname.slice(1);
    const f=path.join(ROOT,p);
    if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('404')}
    const ext=path.extname(f);
    const ct={'.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json','.js':'text/javascript'}[ext]||'application/octet-stream';
    if(p==='index.html'){
      const html=originalHome(fs.readFileSync(f,'utf8'));
      res.writeHead(200,{'Content-Type':ct,'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate','Pragma':'no-cache','Expires':'0'});
      return res.end(html);
    }
    res.writeHead(200,{'Content-Type':ct,'Cache-Control':'public, max-age=3600'});
    fs.createReadStream(f).pipe(res);
  }catch(e){
    console.error(e);
    if(!res.headersSent)json(res,500,{error:'Server error'}); else res.end();
  }
});

server.listen(PORT,()=>console.log(`UYGA YORDAM http://localhost:${PORT}`));
