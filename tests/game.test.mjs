import test from 'node:test';
import assert from 'node:assert/strict';
import {World,HEROES,WIDTH,HEIGHT,WEAPONS} from '../game/engine.mjs';
const step=(g,n=60,input={})=>{for(let i=0;i<n;i++)g.step(1/60,[input]);};
test('movement is normalized, bounded and immune during dash',()=>{
 const a=new World({seed:1}),b=new World({seed:1});const ax=a.players[0].x,ay=a.players[0].y;
 step(a,30,{moveX:1});step(b,30,{moveX:1,moveY:1});
 assert.ok(Math.abs(Math.hypot(b.players[0].x-ax,b.players[0].y-ay)-(a.players[0].x-ax))<.01);
 step(a,600,{moveX:1,moveY:-1});assert.ok(a.players[0].x<=WIDTH-35&&a.players[0].y>=35);
 const p=a.players[0];p.invuln=0;gDash(a);const hp=p.hp;a.damagePlayer(p,99);assert.equal(p.hp,hp);
});
function gDash(g){g.step(1/60,[{dash:true,moveX:1}]);}
test('weapons hit fast moving segments, pierce and expire',()=>{
 const g=new World({seed:5});const p=g.players[0];g.spawnClock=999;p.shot=0;
 g.spawn('grunt',p.x+90,p.y,true);step(g,15,{aimX:1,shoot:true});assert.ok(g.kills>0);
 for(const weapon of Object.keys(WEAPONS)){
  const w=new World({seed:6});w.spawnClock=999;const q=w.players[0];w.collect(q,{type:weapon});assert.equal(q.weapon,weapon);
  w.spawn('brute',q.x+100,q.y,true);step(w,60,{aimX:1,shoot:true});assert.ok(w.kills>0,weapon+' does damage');
  step(w,960,{});assert.equal(q.weapon,null,weapon+' expires');
 }
 const fast=new World({seed:7});fast.spawnClock=999;const q=fast.players[0];fast.collect(q,{type:'beam'});
 fast.spawn('skitter',q.x+37,q.y,true);fast.step(.05,[{aimX:1,shoot:true}]);assert.equal(fast.kills,1);
});
test('each super charges, damages, clears bullets and cannot be spammed',()=>{
 for(const h of HEROES){const g=new World({hero:h.id,seed:2});const p=g.players[0];g.spawn('brute',p.x+90,p.y,true);
 g.hostile.push({x:p.x+20,y:p.y,ttl:5});assert.equal(g.super(p),false);p.charge=100;assert.equal(g.super(p),true);assert.equal(g.kills,1);assert.equal(g.hostile.length,0);assert.equal(g.super(p),false);}
});
test('damage invulnerability, shields and healing enforce health limits',()=>{
 const g=new World({seed:3}),p=g.players[0];p.invuln=0;g.damagePlayer(p,20);assert.equal(p.hp,p.maxHp-20);g.damagePlayer(p,20);assert.equal(p.hp,p.maxHp-20);
 g.collect(p,{type:'health'});assert.equal(p.hp,p.maxHp);g.collect(p,{type:'shield'});assert.equal(p.invuln,7);
});
test('chapter choices pause time, reject invalid inputs and apply once',()=>{
 const g=new World({seed:4});g.time=59.99;g.step(1/60);assert.equal(g.status,'upgrade');assert.equal(new Set(g.upgrades.map(u=>u.id)).size,3);
 const t=g.time;step(g,100);assert.equal(g.time,t);assert.equal(g.chooseUpgrade('garbage'),false);
 const choice=g.upgrades[0].id;assert.equal(g.chooseUpgrade(choice),true);assert.equal(g.status,'playing');assert.equal(g.chooseUpgrade(choice),false);
});
test('co-op revives a teammate and ends only when everyone is down',()=>{
 const g=new World({seed:6,coop:true});g.spawnClock=999;g.players[0].hp=0;g.players[1].x=g.players[0].x;g.players[1].y=g.players[0].y;
 step(g,160);assert.ok(g.players[0].hp>0);assert.equal(g.status,'playing');
 for(const p of g.players){p.invuln=0;g.damagePlayer(p,9999);}assert.equal(g.status,'defeat');
});
test('boss spawn bypasses the horde cap and victory cannot be overwritten',()=>{
 const g=new World({seed:8});for(let i=0;i<190;i++)g.spawn('grunt',40+i*5,50,true);
 g.time=300;g.chapter=5;g.step(1/60);assert.ok(g.portals.some(p=>p.type==='mother'));
 g.spawn('mother',700,130,true);const mother=g.enemies.find(e=>e.type==='mother');g.damageEnemy(mother,1e9,0);assert.equal(g.status,'victory');
 g.players[0].invuln=0;g.damagePlayer(g.players[0],9999);assert.equal(g.status,'victory');
});
test('fresh runs reset score, weapons, health and upgrade multipliers',()=>{
 const a=new World({seed:9});a.players[0].weapon='nova';a.score=100000;a.players[0].damageMul=5;
 const b=new World({seed:9});assert.equal(b.score,0);assert.equal(b.players[0].weapon,null);assert.equal(b.players[0].damageMul,1);assert.equal(b.time,0);
});
test('same seed and commands reproduce the same run',()=>{
 function run(){const g=new World({seed:456,hero:'volt'});g.players[0].invuln=100;for(let i=0;i<3000;i++){g.step(1/60,[{moveX:Math.sin(i/240),moveY:Math.cos(i/240),autoAim:true}]);g.drainEvents();}return g.summary();}
 assert.deepEqual(run(),run());
});
test('three complete six-chapter combat soaks maintain finite bounded state',()=>{
 for(const hero of HEROES){const g=new World({seed:111,hero:hero.id});g.players[0].invuln=999;
  let peak=0,chapters=new Set(),types=new Set();
  for(let i=0;i<19800&&g.status!=='victory';i++){
   if(g.status==='upgrade')g.chooseUpgrade(g.upgrades[0].id);
   const p=g.players[0];p.invuln=999;g.step(1/60,[{moveX:Math.sin(i/230),moveY:Math.cos(i/270),autoAim:true,super:i%180===0}]);g.drainEvents();
   chapters.add(g.chapter);for(const e of g.enemies)types.add(e.type);peak=Math.max(peak,g.enemies.length);
   if(i%600===0){for(const entity of [...g.players,...g.enemies,...g.bullets,...g.hostile]){assert.ok(Number.isFinite(entity.x)&&Number.isFinite(entity.y));}assert.ok(g.particles.length<=650);assert.ok(g.labels.length<=38);}
  }
  assert.equal(chapters.size,6);assert.ok(types.has('warden'));assert.ok(types.has('mother'));
  assert.notEqual(g.status,'defeat');assert.ok(g.kills>150);assert.ok(peak<190);
  console.log(hero.id,JSON.stringify({kills:g.kills,peak,time:Math.round(g.time),score:g.score}));
 }
});
test('renderer draws every hero, enemy, pickup and effect without invalid geometry',async()=>{
 const calls=[];const gradient={addColorStop(){}};
 const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='createRadialGradient')return ()=>gradient;return (...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'finite '+key);calls.push(key);};},set(t,k,v){t[k]=v;return true;}});
 globalThis.document={createElement:()=>({getContext:()=>ctx})};
 const {Renderer}=await import('../game/render.mjs');const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:1280,height:800,left:0,top:0})};
 const r=new Renderer(canvas);const g=new World({coop:true});for(const type of ['grunt','skitter','brute','spitter','charger','splitter','warden','mother'])g.spawn(type,200+g.id*90,220,true);
 for(const type of ['health','shield','charge',...Object.keys(WEAPONS)])g.drop(200+g.id*20,500,type);
 g.players[0].charge=100;g.super(g.players[0]);g.players[1].hp=0;g.hazards.push({x:600,y:700,r:80,ttl:1,hit:false});r.render(g,{aim:{x:500,y:500},touch:{left:{sx:50,sy:50,dx:10,dy:20}}});
 assert.ok(calls.includes('drawImage'));assert.ok(calls.includes('fillText'));
 for(const h of HEROES)r.hero(ctx,{...g.makePlayer(h.id,0),hp:50},1);
});
test('soundtrack schedules valid notes through all six arrangements',async()=>{
 const {AudioDirector}=await import('../game/audio.mjs');const a=new AudioDirector();a.ctx={currentTime:0};a.active=true;let tones=0;
 a.tone=(f,d,type,v,t,end)=>{assert.ok(Number.isFinite(f)&&f>0);assert.ok(d>0);tones++;};a.noiseHit=()=>{};
 for(let c=0;c<6;c++){a.chapter=c;a.next=0;a.step=0;for(let i=0;i<200;i++){a.ctx.currentTime=i*.1;a.schedule();}}
 for(const type of ['shot','hurt','dash','explosion','pickup','upgrade','combo','super','boss','victory','defeat'])a.event({type});
 assert.ok(tones>1000);
});
