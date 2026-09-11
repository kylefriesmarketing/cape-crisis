import test from 'node:test';
import assert from 'node:assert/strict';
import {World,DASHES,hazardHits} from '../game/engine.mjs';
import {MenuPad} from '../game/menu-pad.mjs';
const step=(g,n,input={})=>{for(let k=0;k<n;k++)g.step(1/60,[input]);};
test('signature dashes hit each target only once per dash and Volt erases shots',()=>{
 for(const hero of ['solar','volt','atlas']){
  const g=new World({hero,seed:42}),p=g.players[0];g.spawnClock=999;
  g.spawn('brute',p.x+45,p.y,true);const e=g.enemies[0];e.speed=0;const hp=e.hp;
  g.hostile.push({x:p.x+30,y:p.y+30,vx:0,vy:0,ttl:5,r:4,damage:10});
  step(g,10,{moveX:1,dash:true});
  assert.equal(hp-e.hp,DASHES[hero].damage,hero+' hits once');
  assert.equal(p.dashes,1);assert.ok(p.dashHits.has(e.id));assert.equal(p.hp,p.maxHp);
  if(hero==='volt')assert.equal(g.hostile.length,0);
 }
});
test('knockback moves ordinary enemies, decays, and leaves bosses anchored',()=>{
 const g=new World({seed:1});g.spawnClock=999;g.spawn('brute',300,300,true);const e=g.enemies[0];e.speed=0;
 g.knockback(e,1,0,300);step(g,3);assert.ok(e.x>300);assert.ok(e.kx>0&&e.kx<300);
 g.spawn('mother',900,200,true);const boss=g.enemies.find(e=>e.boss);g.knockback(boss,1,0,500);assert.equal(boss.kx,0);
});
test('bosses alternate distinct warned attacks and enrage once at half health',()=>{
 for(const type of ['mother','warden']){
  const g=new World({seed:2});g.spawn(type,500,300,true);const e=g.enemies[0],p=g.players[0];g.drainEvents();
  g.bossAttack(e,p);assert.ok(g.hostile.length>10);
  g.bossAttack(e,p);assert.equal(g.hazards[0].type,type==='mother'?'beam':'shockwave');assert.ok(g.hazards[0].ttl>g.hazards[0].active);
  const locked={...g.hazards[0]};p.x+=50;p.y+=50;assert.equal(g.hazards[0].angle,locked.angle);
  g.damageEnemy(e,e.maxHp*.51,0);assert.equal(e.enraged,true);g.damageEnemy(e,1,0);assert.equal(g.drainEvents().filter(x=>x.type==='enrage').length,1);
 }
});
test('beam warning does no damage and firing hits only its marked lane once',()=>{
 const g=new World({seed:7}),p=g.players[0];g.spawnClock=999;p.invuln=0;
 g.hazards.push({type:'beam',x:p.x-100,y:p.y,angle:0,length:400,width:40,ttl:2,windup:1.5,active:.5,damage:30,hit:false});
 step(g,70);assert.equal(p.hp,p.maxHp);
 step(g,40);assert.equal(p.hp,p.maxHp-30);
 assert.equal(hazardHits({type:'beam',x:0,y:0,angle:0,length:400,width:40},{x:200,y:80,r:17}),false);
 assert.equal(hazardHits({type:'shockwave',x:0,y:0,radius:100,width:12},{x:95,y:0,r:17},85),true);
 assert.equal(hazardHits({type:'shockwave',x:0,y:0,radius:100,width:12},{x:30,y:0,r:17},85),false);
});
test('co-op recovery upgrades revive at a safe location with protection',()=>{
 const g=new World({coop:true});const p=g.players[1];p.hp=0;p.x=30;p.y=30;
 g.status='upgrade';g.upgrades=[{id:'health'}];assert.ok(g.chooseUpgrade('health'));
 assert.ok(p.hp>0);assert.equal(p.x,720);assert.equal(p.y,450);assert.equal(p.invuln,4);assert.deepEqual(g.acquired,['health']);
});
test('defeat locks score even when a projectile reaches a boss later in the frame',()=>{
 const g=new World({seed:4});g.spawn('mother',700,200,true);g.players[0].invuln=0;g.damagePlayer(g.players[0],9999);
 const before=g.score;g.damageEnemy(g.enemies[0],999999,0);assert.equal(g.status,'defeat');assert.equal(g.score,before);
});
test('gamepad menus repeat directions but never repeat confirmation until release',()=>{
 const m=new MenuPad(),p={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
 m.sample(p,0);p.axes[0]=1;assert.equal(m.sample(p,16).horizontal,1);assert.equal(m.sample(p,60).horizontal,0);assert.equal(m.sample(p,470).horizontal,1);
 p.buttons[0].pressed=true;assert.equal(m.sample(p,480).confirm,true);assert.equal(m.sample(p,700).confirm,false);
 // The same sampler runs through gameplay -> upgrade: holding A must not spend a choice.
 assert.equal(m.sample(p,1000).confirm,false);p.buttons[0].pressed=false;m.sample(p,1020);p.buttons[0].pressed=true;assert.equal(m.sample(p,1040).confirm,true);
 p.axes[0]=-1;assert.equal(m.sample(p,1050).horizontal,-1);
});
test('renderer covers both warning and active states of new boss hazards',async()=>{
 const gradient={addColorStop(){}};
 const ctx=new Proxy({}, {get(t,k){if(k in t)return t[k];if(k==='createRadialGradient')return ()=>gradient;return (...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'finite '+k);};},set(t,k,v){t[k]=v;return true;}});
 globalThis.document={createElement:()=>({getContext:()=>ctx})};
 const {Renderer}=await import('../game/render.mjs');const r=new Renderer({getContext:()=>ctx,getBoundingClientRect:()=>({width:1280,height:720,left:0,top:0})});
 const g=new World({seed:99});g.spawn('mother',500,300,true);g.spawn('warden',900,300,true);
 for(const e of g.enemies){e.attackCount=1;g.bossAttack(e,g.players[0]);}
 r.render(g);for(const h of g.hazards){h.hit=true;h.radius=200;h.ttl=.3;}g.damageFlash=.2;r.render(g);
});
