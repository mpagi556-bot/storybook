'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
try{fs.readFileSync(path.join(__dirname,'.env'),'utf8').split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!l.trim().startsWith('#')&&!(m[1] in process.env))process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')})}catch(e){}
const PORT=+process.env.PORT||3000,SECURE=process.env.HTTPS==='1',ROOT=path.join(__dirname,'public');
const ORIGINS=new Set(['https://storybook-rouge-alpha.vercel.app','https://storybook-peter55.vercel.app','https://storybook-git-main-peter55.vercel.app',...(process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim().replace(/\/$/,'')).filter(Boolean)]);
const allowedOrigin=o=>!!o&&(ORIGINS.has(o)||/^https:\/\/storybook-[a-z0-9-]+-peter55\.vercel\.app$/.test(o));
const cookieAttrs=res=>res.cross?'SameSite=None; Secure':'SameSite=Strict'+(SECURE?'; Secure':'');
const PG=process.env.DATABASE_URL;let q,one,run,ready;
const SEED=['admin','admin','Administrator','5ee1c0de5ee1c0de5ee1c0de5ee1c0de:c0263ea087a424436b84c5f2331d2ecfc15fe5b5a20ad75c43166f4702478051923de59e2a6017dd5d578cd81647be388f3b19d4d663a81b1ba85aab7867e17f'];
if(PG){const{Pool,types}=require('pg');types.setTypeParser(20,Number);const pool=new Pool({connectionString:PG,max:8,ssl:process.env.PGSSL==='1'||/supabase|neon|render|amazonaws/.test(PG)?{rejectUnauthorized:false}:undefined});
 const T=x=>{let i=0;return x.replace(/\?/g,()=>'$'+ ++i)};q=async(x,...a)=>(await pool.query(T(x),a)).rows;one=async(x,...a)=>(await q(x,...a))[0];run=async(x,...a)=>{await pool.query(T(x),a)};
 ready=pool.query(fs.readFileSync(path.join(__dirname,'schema.postgres.sql'),'utf8'));
}else{const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.env.DB||path.join(__dirname,'storybook.db'));db.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;');db.exec(fs.readFileSync(path.join(__dirname,'schema.sqlite.sql'),'utf8'));
 q=async(x,...a)=>db.prepare(x).all(...a);one=async(x,...a)=>db.prepare(x).get(...a);run=async(x,...a)=>{db.prepare(x).run(...a)};
 ready=run("INSERT INTO users(role,username,name,pass_hash,status,must_change,created_at,approved_at)VALUES(?,?,?,?,'approved',1,?,?)ON CONFLICT(username)DO NOTHING",...SEED,Date.now(),Date.now())}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),now=()=>Date.now();
const hash=p=>{const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,64).toString('hex')};
const check=(p,h)=>{const[s,k]=h.split(':');return crypto.timingSafeEqual(crypto.scryptSync(p,s,64),Buffer.from(k,'hex'))};
const DUMMY=hash('x'),audit=(u,a,d,ip)=>run('INSERT INTO audit(at,user_id,action,detail,ip)VALUES(?,?,?,?,?)',now(),u,a,d||'',ip||'');
const E=(code,error)=>Object.assign(new Error(error),{code});
const hits=new Map();const limit=(ip,k,max,ms)=>{const key=k+ip,h=hits.get(key)||{n:0,t:now()};if(now()-h.t>ms){h.n=0;h.t=now()}if(++h.n>max)throw E(429,'Too many attempts. Please wait a few minutes.');hits.set(key,h)};
setInterval(()=>{hits.clear();run('DELETE FROM sessions WHERE expires_at<?',now()).catch(()=>{})},6e5).unref();

/* ---- marking (server side; mirrors the on-screen engine) ---- */
function mark(Q,A){let got=0;const by={},res=[];Q.forEach((x,i)=>{const a=A[i];let s=0;
 if(x.type==='mc')s=a===x.ans?x.marks:0;
 else if(x.type==='cloze')x.ans.forEach((w,b)=>{if(String((a||[])[b]||'').trim().toLowerCase()===w.toLowerCase())s++});
 else if(x.type==='write'){const w=String(a||'').trim(),sn=w.split(/[.!?]+/).filter(z=>z.trim().split(/\s+/).length>=3).length,wc=w?w.split(/\s+/).length:0,hit=x.kw.some(k=>w.toLowerCase().includes(k.toLowerCase()));s=(sn>=x.need?1:0)+(hit?1:0)+(x.marks>2&&wc>=25?1:0)}
 else x.items.forEach((it,k)=>{if(+((a||[])[k])===it.n)s++});
 s=Math.min(s,x.marks);got+=s;(by[x.sec]=by[x.sec]||{g:0,m:0}).g+=s;by[x.sec].m+=x.marks});return{got,by}}
const strip=Q=>Q.map(x=>{x={...x};if(x.type==='mc')delete x.ans;else if(x.type==='cloze'){x.words=x.words.map((w,i)=>x.blank.includes(i)?w.replace(/[\p{L}’'\-]+/u,m=>'x'.repeat(m.length)):w);delete x.ans}else if(x.type==='order')x.items=x.items.map(({e})=>({e}));return x});
const validQ=Q=>Array.isArray(Q)&&Q.length>0&&Q.length<80&&Q.every(x=>x&&['mc','cloze','write','order'].includes(x.type)&&Number.isInteger(x.marks)&&typeof x.sec==='string'&&(x.type!=='mc'||(typeof x.ans==='string'&&x.opts.includes(x.ans)))&&(x.type!=='cloze'||(Array.isArray(x.ans)&&Array.isArray(x.blank)&&Array.isArray(x.words)))&&(x.type!=='write'||Array.isArray(x.kw))&&(x.type!=='order'||x.items.every(i=>Number.isInteger(i.n))));

/* ---- routes ---- */
const R=[],add=(m,p,roles,h)=>R.push({m,roles,h,re:new RegExp('^'+p.replace(/:(\w+)/g,'(?<$1>[0-9]+)')+'$')});
const T=['admin','teacher'],ALL=['admin','teacher','student'],S=['student'],LV=/^P\.[1-6]$/;
const str=(v,min,max,label)=>{v=String(v==null?'':v).trim();if(v.length<min||v.length>max)throw E(400,label+' must be '+min+' to '+max+' characters.');return v};
const pub=u=>({id:u.id,role:u.role,name:u.name,username:u.username,level:u.level,must_change:u.must_change})
const uname=v=>{const x=str(v,3,30,'Username').toLowerCase().replace(/[^a-z0-9._-]/g,'');if(x.length<3)throw E(400,'Username needs letters or numbers.');return x};
const classes=v=>{const l=[...new Set(String(v||'').split(',').map(x=>x.trim()).filter(Boolean))];if(!l.length||!l.every(x=>LV.test(x)))throw E(400,'Choose at least one class from P.1 to P.6.');return l.sort().join(',')};
const scope=u=>u.role==='admin'?null:(u.level||'').split(',').filter(Boolean);
const inS=(sc,col)=>sc===null?['',[]]:sc.length?[' AND '+col+' IN('+sc.map(()=>'?').join(',')+')',sc]:[' AND 1=0',[]];
const canSee=(u,t)=>u.role!=='student'||(u.level&&t.level.startsWith(u.level+' '));
add('GET','/api/me',null,async({u})=>({user:u?pub(u):null}));
add('POST','/api/signup',null,async({b,ip})=>{await limit(ip,'signup',8,36e5);if(!['student','teacher'].includes(b.role))throw E(400,'Choose pupil or teacher.');const role=b.role,un=uname(b.username),pw=str(b.password,role==='student'?4:8,100,role==='student'?'PIN':'Password');
 const lv=role==='student'?(LV.test(b.level)?b.level:(()=>{throw E(400,'Choose your class.')})()):classes(b.level);
 if(await one('SELECT 1 x FROM users WHERE username=?',un))throw E(409,'That username is taken. Try another.');
 await run("INSERT INTO users(role,username,name,pass_hash,level,status,created_at)VALUES(?,?,?,?,?,'pending',?)",role,un,str(b.name,2,60,'Name'),hash(pw),lv,now());await audit(null,'signup',un+' ('+role+')',ip);return{ok:1}});
add('POST','/api/login',null,async({b,ip,res})=>{limit(ip,'login',25,6e5);const un=String(b.username||'').trim().toLowerCase(),pw=String(b.password||''),u=await one('SELECT * FROM users WHERE username=?',un);
 if(u&&u.locked_until>now())throw E(423,'This account is locked for a few minutes after too many wrong tries.');
 const ok=check(pw,u?u.pass_hash:DUMMY)&&u;
 if(!ok){if(u){const f=u.fails+1;await run('UPDATE users SET fails=?,locked_until=? WHERE id=?',f%5,f%5?0:now()+6e5,u.id);await audit(u.id,'login_fail','',ip)}throw E(401,'Username or password is not correct.')}
 if(u.status==='pending')throw E(403,'Your account is waiting for the administrator’s approval. Please try again later.');
 if(u.status==='rejected')throw E(403,'Your sign-up was not approved. Please speak to the administrator.');
 if(u.status!=='approved')throw E(403,'This account is switched off. Please speak to the administrator.');
 await run('UPDATE users SET fails=0,locked_until=0 WHERE id=?',u.id);const tok=crypto.randomBytes(32).toString('hex');
 await run('INSERT INTO sessions VALUES(?,?,?,?)',sha(tok),u.id,now()+12*36e5,ip);await audit(u.id,'login','',ip);
 res.setHeader('Set-Cookie','sid='+tok+'; HttpOnly; '+cookieAttrs(res)+'; Path=/; Max-Age=43200');return{user:pub(u)}});
add('POST','/api/logout',null,async({req,res})=>{const t=(req.headers.cookie||'').match(/sid=([a-f0-9]+)/);if(t)await run('DELETE FROM sessions WHERE token_hash=?',sha(t[1]));res.setHeader('Set-Cookie','sid=; HttpOnly; '+cookieAttrs(res)+'; Path=/; Max-Age=0');return{ok:1}});
add('POST','/api/password',ALL,async({u,b,ip})=>{if(!check(String(b.old||''),u.pass_hash))throw E(400,'Your current password is not correct.');const pw=str(b.password,u.role==='student'?4:8,100,u.role==='student'?'PIN':'Password');
 if(pw===String(b.old))throw E(400,'Choose a different password from the old one.');await run('UPDATE users SET pass_hash=?,must_change=0 WHERE id=?',hash(pw),u.id);await audit(u.id,'password_change','',ip);return{ok:1}});
add('GET','/api/users',T,async({u})=>{const sc=scope(u);if(sc===null)return q('SELECT id,role,username,name,level,status,created_at FROM users ORDER BY CASE status WHEN \'pending\' THEN 0 ELSE 1 END,role,name');
 const[c,a]=inS(sc,'level');return q("SELECT id,role,username,name,level,status,created_at FROM users WHERE role='student' AND status='approved'"+c+' ORDER BY level,name',...a)});
add('POST','/api/users',['admin'],async({u,b,ip})=>{const role=['teacher','admin'].includes(b.role)?b.role:'student',un=uname(b.username),pw=str(b.password,role==='student'?4:8,100,role==='student'?'PIN':'Password');
 if(await one('SELECT 1 x FROM users WHERE username=?',un))throw E(409,'That username is taken.');const lv=role==='student'?(LV.test(b.level)?b.level:'P.1'):role==='teacher'?classes(b.level):null;
 const r=await one("INSERT INTO users(role,username,name,pass_hash,level,status,created_by,created_at,approved_at)VALUES(?,?,?,?,?,'approved',?,?,?)RETURNING id",role,un,str(b.name,2,60,'Name'),hash(pw),lv,u.id,now(),now());await audit(u.id,'user_add',un,ip);return{id:r.id}});
add('PATCH','/api/users/:id',T,async({u,p,b,ip})=>{const t=await one('SELECT * FROM users WHERE id=?',p.id);if(!t)throw E(404,'User not found.');const sc=scope(u);
 if(sc!==null&&!(t.role==='student'&&sc.includes(t.level)))throw E(404,'User not found.');
 if(b.password!=null){await run('UPDATE users SET pass_hash=?,fails=0,locked_until=0,must_change=0 WHERE id=?',hash(str(b.password,t.role==='student'?4:8,100,'Password')),t.id);await run('DELETE FROM sessions WHERE user_id=?',t.id)}
 if(u.role==='admin'){
  if(b.status!=null){if(!['approved','rejected','disabled'].includes(b.status)||t.id===u.id)throw E(400,'That change is not allowed.');
   const lv=b.level!=null?(t.role==='student'?(LV.test(b.level)?b.level:(()=>{throw E(400,'Choose a class.')})()):t.role==='teacher'?classes(b.level):t.level):t.level;
   if(b.status==='approved'&&t.role!=='admin'&&!lv)throw E(400,'Choose a class first.');
   await run('UPDATE users SET status=?,level=?,approved_at=? WHERE id=?',b.status,lv,b.status==='approved'?now():t.approved_at,t.id);if(b.status!=='approved')await run('DELETE FROM sessions WHERE user_id=?',t.id)}
  else if(b.level!=null&&t.role!=='admin')await run('UPDATE users SET level=? WHERE id=?',t.role==='student'?(LV.test(b.level)?b.level:t.level):classes(b.level),t.id)}
 await audit(u.id,'user_edit',t.username+' '+JSON.stringify({s:b.status,l:b.level}),ip);return{ok:1}});
add('GET','/api/tests',ALL,async({u})=>u.role==='student'?q("SELECT t.id,t.title,t.level,t.total,a.status,a.got FROM tests t LEFT JOIN attempts a ON a.test_id=t.id AND a.user_id=? WHERE t.published=1 AND t.level LIKE ? ORDER BY t.id DESC",u.id,(u.level||'none')+' %')
 :q("SELECT t.id,t.title,t.level,t.total,t.published,t.created_at,(SELECT COUNT(*) FROM attempts a WHERE a.test_id=t.id AND a.status='done') AS done FROM tests t ORDER BY t.id DESC"));
add('POST','/api/tests',T,async({u,b,ip})=>{const Q=b.Q;if(!validQ(Q))throw E(400,'The questions are not valid.');const total=Q.reduce((s,x)=>s+x.marks,0);
 const r=await one('INSERT INTO tests(title,level,story,questions,total,published,author_id,created_at)VALUES(?,?,?,?,?,?,?,?)RETURNING id',str(b.title,2,120,'Title'),str(b.level,2,40,'Level'),str(b.story,10,6000,'Story'),JSON.stringify(Q),total,b.published?1:0,u.id,now());await audit(u.id,'test_add',b.title,ip);return{id:r.id}});
add('GET','/api/tests/:id',ALL,async({u,p})=>{const t=await one('SELECT * FROM tests WHERE id=?',p.id);if(!t||(u.role==='student'&&!t.published)||!canSee(u,t))throw E(404,'Story not found.');
 const Q=JSON.parse(t.questions);return{id:t.id,title:t.title,level:t.level,story:t.story,total:t.total,published:t.published,Q:u.role==='student'?strip(Q):Q}});
add('PATCH','/api/tests/:id',T,async({p,b})=>{await run('UPDATE tests SET published=? WHERE id=?',b.published?1:0,p.id);return{ok:1}});
add('DELETE','/api/tests/:id',T,async({u,p,ip})=>{await run('DELETE FROM tests WHERE id=?',p.id);await audit(u.id,'test_delete',String(p.id),ip);return{ok:1}});
add('POST','/api/tests/:id/start',S,async({u,p})=>{const t=await one('SELECT * FROM tests WHERE id=? AND published=1',p.id);if(!t||!canSee(u,t))throw E(404,'Story not found.');
 await run('INSERT INTO attempts(test_id,user_id,started_at)VALUES(?,?,?)ON CONFLICT(test_id,user_id)DO NOTHING',p.id,u.id,now());return one('SELECT id,status FROM attempts WHERE test_id=? AND user_id=?',p.id,u.id)});
add('POST','/api/tests/:id/submit',S,async({u,p,b,ip})=>{const a=await one('SELECT * FROM attempts WHERE test_id=? AND user_id=?',p.id,u.id);if(!a)throw E(400,'Start the story first.');if(a.status==='done')throw E(409,'You have already finished this test.');
 const t=await one('SELECT * FROM tests WHERE id=?',p.id),A=Array.isArray(b.answers)?b.answers.slice(0,100):[],r=mark(JSON.parse(t.questions),A);
 await run("UPDATE attempts SET status='done',answers=?,got=?,by_level=?,finished_at=? WHERE id=? AND status='started'",JSON.stringify(A).slice(0,2e5),r.got,JSON.stringify(r.by),now(),a.id);await audit(u.id,'submit',String(p.id),ip);return{id:a.id}});
add('GET','/api/attempts/:id',ALL,async({u,p})=>{const a=await one('SELECT a.*,t.title,t.story,t.total,t.questions,s.name,s.level AS pl FROM attempts a JOIN tests t ON t.id=a.test_id JOIN users s ON s.id=a.user_id WHERE a.id=?',p.id);
 const sc=scope(u);if(!a||a.status!=='done'||(u.role==='student'&&a.user_id!==u.id)||(sc&&!sc.includes(a.pl)))throw E(404,'Result not found.');
 return{id:a.id,title:a.title,story:a.story,total:a.total,got:a.got,name:a.name,Q:JSON.parse(a.questions),ans:JSON.parse(a.answers),by:JSON.parse(a.by_level)}});
add('GET','/api/results',ALL,async({u})=>{let c='',a=[];if(u.role==='student'){c=' AND a.user_id=?';a=[u.id]}else[c,a]=inS(scope(u),'s.level');
 return(await q("SELECT a.id,a.user_id,s.name,s.username,s.level AS pupil_level,t.title,t.level,a.got,t.total,a.by_level,a.finished_at FROM attempts a JOIN tests t ON t.id=a.test_id JOIN users s ON s.id=a.user_id WHERE a.status='done'"+c+' ORDER BY a.finished_at DESC',...a)).map(r=>({...r,by:JSON.parse(r.by_level),by_level:undefined}))});
add('GET','/api/audit',['admin'],async()=>q('SELECT a.at,a.action,a.detail,a.ip,u.username FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100'));

/* ---- server ---- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const HEAD={'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Cross-Origin-Opener-Policy':'same-origin',...(SECURE?{'Strict-Transport-Security':'max-age=31536000; includeSubDomains'}:{})};
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const readBody=req=>new Promise((ok,no)=>{let d='',n=0;req.on('data',c=>{n+=c.length;if(n>1e6){no(E(413,'Too large.'));req.destroy()}else d+=c});req.on('end',()=>{try{ok(d?JSON.parse(d):{})}catch{no(E(400,'Bad request.'))}})});
const srv=http.createServer(async(req,res)=>{try{
 await ready;Object.entries(HEAD).forEach(([k,v])=>res.setHeader(k,v));const ip=req.socket.remoteAddress,url=new URL(req.url,'http://x'),pn=url.pathname;
 if(!pn.startsWith('/api/')){const f=path.normalize(path.join(ROOT,pn==='/'?'index.html':pn));if(!f.startsWith(ROOT)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});return fs.createReadStream(f).pipe(res)}
 const o=req.headers.origin,sameOrigin=!o||(()=>{try{return new URL(o).host===req.headers.host}catch{return false}})();
 if(!sameOrigin&&allowedOrigin(o)){res.cross=true;res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Vary','Origin')}
 if(req.method==='OPTIONS'){if(!res.cross){res.writeHead(403);return res.end()}res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Requested-With','Access-Control-Max-Age':'600'});return res.end()}
 limit(ip,'all',600,6e4);
 if(req.method!=='GET'){if(req.headers['x-requested-with']!=='sb')throw E(403,'Blocked.');if(!sameOrigin&&!res.cross)throw E(403,'Blocked.')}
 const r=R.find(x=>x.m===req.method&&x.re.test(pn));if(!r)throw E(404,'Not found.');
 const m=(req.headers.cookie||'').match(/sid=([a-f0-9]{64})/),u=m?await one("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='approved'",sha(m[1]),now()):null;
 if(r.roles&&(!u||!r.roles.includes(u.role)))throw E(u?403:401,u?'You do not have access to this.':'Please sign in.');
 if(u&&u.must_change&&!['/api/me','/api/logout','/api/password'].includes(pn))throw E(403,'Please choose a new password first.');
 const b=['POST','PATCH'].includes(req.method)?await readBody(req):{};send(res,200,await r.h({req,res,u,ip,b,p:pn.match(r.re).groups||{}}));
}catch(e){if(typeof e.code!=='number')console.error(e);send(res,typeof e.code==='number'?e.code:500,{error:typeof e.code==='number'?e.message:'Something went wrong on the server.'})}});
ready.then(()=>srv.listen(PORT,()=>console.log('Storybook School running at http://localhost:'+PORT+' ('+(PG?'PostgreSQL':'SQLite')+')')),e=>{console.error('Database setup failed:',e.message);process.exit(1)});
module.exports={mark,strip};
