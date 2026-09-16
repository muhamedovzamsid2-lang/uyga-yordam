// UYGA YORDAM production sync 2026-09-16
// Railway sync trigger: deploy the current main branch, not the stale snapshot.
const http=require('http'), fs=require('fs'), path=require('path'), crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const ROOT=__dirname, PORT=process.env.PORT||3000, db=new DatabaseSync(path.join(ROOT,'uyga.db'));
db.exec(`CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, service TEXT, price INTEGER, name TEXT, phone TEXT, address TEXT, date TEXT, time TEXT, note TEXT, lat REAL, lon REAL, status TEXT, created TEXT);`);
const ADMIN_USER=process.env.ADMIN_USER||'admin', ADMIN_PASS=process.env.ADMIN_PASS||'admin123';
const WORKER_USER=process.env.WORKER_USER||'worker', WORKER_PASS=process.env.WORKER_PASS||'worker123';
const SECRET=process.env.AUTH_SECRET||'uyga-yordam-change-me';
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
function body(req){return new Promise((ok,fail)=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e6)req.destroy()});req.on('end',()=>{try{ok(d?JSON.parse(d):{})}catch(e){fail(e)}})})}
function token(role){let exp=Date.now()+12*3600e3,p=`${role}.${exp}`,sig=crypto.createHmac('sha256',SECRET).update(p).digest('hex');return `${p}.${sig}`}
function role(req){let t=(req.headers.authorization||'').replace(/^Bearer\s+/,'');let [r,e,s]=t.split('.');if(!r||!e||!s||+e<Date.now())return null;let x=crypto.createHmac('sha256',SECRET).update(`${r}.${e}`).digest('hex');return crypto.timingSafeEqual(Buffer.from(s),Buffer.from(x))?r:null}
function rows(){return db.prepare('SELECT * FROM orders ORDER BY created DESC').all().map(o=>({...o,gps:o.lat==null?null:{lat:o.lat,lon:o.lon}}))}
function originalHome(html){
  const home=`<section id="home" class="promo-home"><div class="promo-art"><img src="hero.png" alt="UYGA YORDAM — хизматлар платформаси"><button class="promo-hotspot promo-main-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button><button class="promo-hotspot promo-phone-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button><button class="promo-hotspot promo-bottom-order" type="button" aria-label="Буюртма бериш" onclick="openOrder()"></button></div><div id="services" class="hidden"></div></section>`;
  const css=`<style id="original-uyga-design">.promo-home{margin:0 -5%}.promo-art{position:relative;width:100%;line-height:0;overflow:hidden}.promo-art>img{display:block;width:100%;height:auto;margin:0;border-radius:0;box-shadow:none}.promo-hotspot{position:absolute;display:block;padding:0;margin:0;border:0;background:transparent;cursor:pointer;z-index:2}.promo-hotspot:focus-visible{outline:3px solid #12a58c;outline-offset:2px;border-radius:18px}.promo-main-order{left:2.2%;top:30.5%;width:18%;height:4.2%}.promo-phone-order{left:75.5%;top:16%;width:11%;height:4%}.promo-bottom-order{left:68.2%;top:88%;width:18.2%;height:4.2%}@media(max-width:700px){.promo-main-order{left:2%;width:18%;height:4.5%}.promo-phone-order{left:75%;width:12%;height:4%}.promo-bottom-order{left:68%;width:19%;height:4.5%}}</style>`;
  const start=html.indexOf('<section id="home"');
  if(start<0)return html;
  const end=html.indexOf('</section>',start);
  if(end<0)return html;
  const replaced=html.slice(0,start)+home+html.slice(end+'</section>'.length);
  return replaced.includes('class="promo-home"') ? replaced.replace('</head>',css+'</head>') : html;
}
const server=http.createServer(async(req,res)=>{
 try{
  let u=new URL(req.url,'http://x');
  if(req.method==='POST'&&u.pathname==='/api/login'){let b=await body(req);let r=(b.username===ADMIN_USER&&b.password===ADMIN_PASS)?'admin':(b.username===WORKER_USER&&b.password===WORKER_PASS)?'worker':null;return r?json(res,200,{token:token(r),role:r}):json(res,401,{error:'Нотўғри логин ёки парол'});}
  if(req.method==='POST'&&u.pathname==='/api/orders'){let b=await body(req);if(!b.id||!b.name||!b.phone||!b.address)return json(res,400,{error:'Маълумот етарли эмас'});db.prepare(`INSERT INTO orders(id,service,price,name,phone,address,date,time,note,lat,lon,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(b.id,b.service,b.price,b.name,b.phone,b.address,b.date||'',b.time||'',b.note||'',b.gps?.lat??null,b.gps?.lon??null,'Янги',new Date().toISOString());return json(res,201,{ok:true,id:b.id});}
  if(req.method==='GET'&&u.pathname.startsWith('/api/orders/')){let id=decodeURIComponent(u.pathname.split('/').pop()),o=db.prepare('SELECT * FROM orders WHERE id=?').get(id);if(!o)return json(res,404,{error:'Топилмади'});return json(res,200,{...o,gps:o.lat==null?null:{lat:o.lat,lon:o.lon}});}
  if(req.method==='GET'&&u.pathname==='/api/orders'){let r=role(req);if(!r)return json(res,401,{error:'Кириш керак'});return json(res,200,rows());}
  if(req.method==='PATCH'&&u.pathname.startsWith('/api/orders/')){let r=role(req);if(r!=='admin'&&r!=='worker')return json(res,403,{error:'Рухсат йўқ'});let id=decodeURIComponent(u.pathname.split('/').pop()),b=await body(req);let allowed=['Янги','Ходим бириктирилди','Йўлда','Бажарилмоқда','Тугади'];if(!allowed.includes(b.status))return json(res,400,{error:'Нотўғри ҳолат'});db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status,id);return json(res,200,{ok:true});}
  if(req.method==='DELETE'&&u.pathname==='/api/orders'){if(role(req)!=='admin')return json(res,403,{error:'Рухсат йўқ'});db.exec('DELETE FROM orders');return json(res,200,{ok:true});}
  if(req.method==='GET'&&u.pathname==='/health')return json(res,200,{ok:true});
  let p=u.pathname==='/'?'index.html':u.pathname.slice(1),f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('404')};let ext=path.extname(f),ct={'.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json','.js':'text/javascript'}[ext]||'application/octet-stream';
  if(p==='index.html'){const html=originalHome(fs.readFileSync(f,'utf8'));res.writeHead(200,{'Content-Type':ct,'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate','Pragma':'no-cache','Expires':'0'});return res.end(html)}
  res.writeHead(200,{'Content-Type':ct});fs.createReadStream(f).pipe(res);
 }catch(e){console.error(e);json(res,500,{error:'Server error'})}
});server.listen(PORT,()=>console.log(`UYGA YORDAM http://localhost:${PORT}`));
