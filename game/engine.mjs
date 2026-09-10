export const WIDTH = 1440, HEIGHT = 900;
export const HEROES = [
  {id:'solar',name:'SOLAR',role:'THE STAR POWER',color:'#ff684e',light:'#ffdca0',hp:120,speed:265,rate:.16,damage:26,super:'SUPERNOVA',desc:'Focused photon bolts. A supernova that clears the block.',tag:'BALANCED',symbol:'S'},
  {id:'volt',name:'VOLT',role:'THE LIVE WIRE',color:'#56e4ff',light:'#c6faff',hp:95,speed:315,rate:.105,damage:16,super:'CHAIN REACTION',desc:'Lightning that jumps between aliens. Fast feet. Bad attitude.',tag:'FAST + ELECTRIC',symbol:'V'},
  {id:'atlas',name:'ATLAS',role:'THE HEAVY HITTER',color:'#f9d85f',light:'#fff0b0',hp:160,speed:225,rate:.37,damage:25,super:'METEOR STRIKE',desc:'A three-shot gravity punch. Turns a crowd into a crater.',tag:'ARMOR + SPREAD',symbol:'A'}
];
export const CHAPTERS = [
 {name:'UNINVITED GUESTS',sub:'They came in peace. Kidding.',color:'#b4f563',bpm:126},
 {name:'STATIC SHOCK',sub:'The city has a new electricity problem.',color:'#63e2f9',bpm:138},
 {name:'HEAVY METAL',sub:'Something big just double-parked.',color:'#ffbe55',bpm:144},
 {name:'THE FLOOR IS SPACE',sub:'Mind the orbital bombardment.',color:'#dd88ff',bpm:150},
 {name:'EVERYBODY PANIC',sub:'This is what the cape is for.',color:'#ff6479',bpm:156},
 {name:'MOTHERSHIP ISSUES',sub:'Take out their ride home.',color:'#b4f563',bpm:162}
];
export const UPGRADES = [
 {id:'damage',name:'HEAVY HANDS',desc:'+22% damage. Make every hit count.',icon:'crosshair'},
 {id:'rate',name:'QUICK DRAW',desc:'Fire 18% faster. Less talking, more blasting.',icon:'zap'},
 {id:'health',name:'SECOND WIND',desc:'+25 max health and restore 50 health.',icon:'heart'},
 {id:'speed',name:'AFTERIMAGE',desc:'+12% movement. Dash recharges faster.',icon:'wind'},
 {id:'charge',name:'STAR BATTERY',desc:'Super charges 35% faster. Fill 30% now.',icon:'sun'},
 {id:'pierce',name:'THROUGH & THROUGH',desc:'Shots pierce one more alien.',icon:'arrow'}
];
export const WEAPONS = {
 beam:{name:'PRISM BEAM',color:'#5ce8ff',duration:16},
 nova:{name:'NOVA CANNON',color:'#ff9664',duration:16},
 scatter:{name:'STAR SCATTER',color:'#f9dc5c',duration:16},
 rapid:{name:'HYPERDRIVE',color:'#d6a0ff',duration:16}
};
const ENEMIES={
 grunt:{hp:38,speed:77,r:17,score:90,color:'#b4f563'},
 skitter:{hp:24,speed:144,r:12,score:110,color:'#63e2f9'},
 brute:{hp:235,speed:49,r:29,score:360,color:'#df88fc'},
 spitter:{hp:78,speed:61,r:20,score:210,color:'#f5bd55'},
 charger:{hp:110,speed:88,r:21,score:250,color:'#ff6e83'},
 splitter:{hp:130,speed:67,r:23,score:270,color:'#a2ef77'},
 warden:{hp:4300,speed:39,r:62,score:6500,color:'#ffad5b'},
 mother:{hp:15000,speed:34,r:83,score:20000,color:'#d3fa7c'}
};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class World {
 constructor({hero='solar',difficulty='normal',coop=false,seed=Date.now()}={}) {
  this.seed=seed>>>0; this.id=0; this.time=0; this.status='playing'; this.chapter=0;
  this.score=0; this.kills=0; this.combo=0; this.comboTimer=0; this.bestCombo=0;
  this.difficulty=difficulty; this.mult=difficulty==='casual'?.7:difficulty==='hard'?1.28:1;
  this.enemies=[];this.bullets=[];this.hostile=[];this.pickups=[];this.portals=[];
  this.particles=[];this.rings=[];this.labels=[];this.hazards=[];this.events=[];
  this.spawnClock=1.3;this.pickupClock=9;this.hazardClock=7;this.shake=0;
  this.banner={title:'ISSUE 01 / UNINVITED GUESTS',sub:CHAPTERS[0].sub,ttl:4};
  this.upgrades=[];this.pendingChapter=-1;this.miniSpawned=false;this.motherSpawned=false;
  this.players=[this.makePlayer(hero,0)];if(coop)this.players.push(this.makePlayer(hero==='volt'?'atlas':'volt',1));
  this.grid=new Map();
 }
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 makePlayer(hero,id){const def=HEROES.find(h=>h.id===hero)||HEROES[0];return {
  id,hero:def.id,def,x:WIDTH/2+(id?48:-24),y:HEIGHT/2,r:17,hp:def.hp,maxHp:def.hp,
  angle:-Math.PI/2,shot:0,invuln:2,dashCooldown:0,dashTime:0,dashX:0,dashY:0,
  charge:35,superTime:0,weapon:null,weaponTime:0,damageMul:1,rateMul:1,speedMul:1,chargeMul:1,pierce:0,
  lastDash:false,lastSuper:false,trail:[],revive:0,kills:0
 };}
 emit(type,data={}){this.events.push({type,...data});}
 drainEvents(){return this.events.splice(0);}
 burst(x,y,color,count=12,power=140){for(let i=0;i<count;i++){const a=this.random()*Math.PI*2,s=power*(.3+this.random());this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ttl:.35+this.random()*.45,max:.8,color,r:2+this.random()*3});}if(this.particles.length>650)this.particles.splice(0,this.particles.length-650);}
 ring(x,y,color,r=160){this.rings.push({x,y,color,r,t:0,ttl:.55});}
 label(x,y,text,color='#fff',big=false){this.labels.push({x,y,text,color,big,ttl:big?1.5:.75});if(this.labels.length>38)this.labels.shift();}
 target(entity){let best=null,d=Infinity;for(const p of this.players)if(p.hp>0){let q=distance(entity,p);if(q<d){d=q;best=p;}}return best;}
 nearest(entity,range=Infinity,exclude=null){let best=null,d=range;for(const e of this.enemies)if(e.hp>0&&e!==exclude){const q=distance(entity,e);if(q<d){best=e;d=q;}}return best;}
 spawn(type,x,y,immediate=false){
  if(!ENEMIES[type]||(!['mother','warden'].includes(type)&&this.enemies.length+this.portals.length>185))return;
  if(x==null){const side=Math.floor(this.random()*4),n=this.random();x=side===0?40:side===1?WIDTH-40:60+n*(WIDTH-120);y=side===2?40:side===3?HEIGHT-40:60+n*(HEIGHT-120);}
  if(!immediate){this.portals.push({type,x,y,ttl:type==='mother'||type==='warden'?2.2:.85});return;}
  const d=ENEMIES[type],boss=type==='warden'||type==='mother';
  const hp=d.hp*(boss?1:1+this.chapter*.085)*this.mult*(this.players.length===2?1.5:1);
  this.enemies.push({...d,type,x,y,id:++this.id,hp,maxHp:hp,angle:0,hit:0,
   cool:1+this.random()*2,phase:'hunt',timer:0,vx:0,vy:0,boss,age:0});
  if(boss){this.emit('boss');this.banner={title:type==='mother'?'THE MOTHERSHIP':'THE COLLECTION AGENT',sub:type==='mother'?'Send it back to the manufacturer.':'It would like to speak to your planet.',ttl:4};this.shake=15;}
 }
 buildGrid(){this.grid.clear();for(const e of this.enemies){if(e.hp<=0)continue;const key=Math.floor(e.x/90)+','+Math.floor(e.y/90);if(!this.grid.has(key))this.grid.set(key,[]);this.grid.get(key).push(e);}}
 nearby(x,y,r=90){const out=[];for(let i=Math.floor((x-r)/90);i<=Math.floor((x+r)/90);i++)for(let j=Math.floor((y-r)/90);j<=Math.floor((y+r)/90);j++){const cell=this.grid.get(i+','+j);if(cell)out.push(...cell);}return out;}
 fire(p,angle){
  const weapon=p.weapon;
  let angles=[0],speed=850,damage=p.def.damage*p.damageMul,r=4,pierce=p.pierce,life=1.6,rate=p.def.rate/p.rateMul;
  if(p.hero==='atlas'&&!weapon)angles=[-.16,0,.16];
  if(weapon==='scatter'){angles=[-.32,-.16,0,.16,.32];damage=23*p.damageMul;rate=.24/p.rateMul;}
  if(weapon==='beam'){speed=1300;damage=43*p.damageMul;pierce+=6;r=5;rate=.14/p.rateMul;}
  if(weapon==='nova'){speed=580;damage=85*p.damageMul;r=9;rate=.36/p.rateMul;}
  if(weapon==='rapid'){angles=[-.055,.055];damage=20*p.damageMul;rate=.07/p.rateMul;}
  for(const a of angles){const q=angle+a;this.bullets.push({x:p.x+Math.cos(q)*23,y:p.y+Math.sin(q)*23,
   vx:Math.cos(q)*speed,vy:Math.sin(q)*speed,damage,r,pierce,ttl:life,owner:p.id,
   color:weapon?WEAPONS[weapon].color:p.def.color,weapon,chain:p.hero==='volt'&&!weapon,hit:new Set()});}
  p.shot=rate;this.emit('shot',{hero:p.hero,weapon});
 }
 damageEnemy(e,damage,owner){
  if(e.hp<=0)return;e.hp-=damage;e.hit=.09;
  if(e.hp>0)return;
  const p=this.players[owner];if(p){p.charge=clamp(p.charge+(e.boss?25:2.1)*p.chargeMul,0,100);p.kills++;}
  this.combo++;this.comboTimer=3;this.bestCombo=Math.max(this.bestCombo,this.combo);
  const mult=1+Math.min(9,Math.floor(this.combo/12));const score=e.score*mult;this.score+=score;this.kills++;
  this.burst(e.x,e.y,e.color,e.boss?70:7,e.boss?430:100);
  if(this.kills%4===0||e.boss)this.label(e.x,e.y,'+'+score,e.color,e.boss);
  if(this.combo%25===0){this.label(p?.x||e.x,(p?.y||e.y)-50,this.combo+' HIT COMBO!','#f7f6df',true);this.emit('combo');}
  if(e.type==='splitter'){for(let i=0;i<3;i++)this.spawn('skitter',e.x+(this.random()-.5)*40,e.y+(this.random()-.5)*40,true);}
  if(this.random()<.055||e.boss)this.drop(e.x,e.y,e.boss?'health':null);
  if(e.boss){this.shake=24;this.ring(e.x,e.y,e.color,650);this.emit('explosion');for(const p of this.players)if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+35);}
  if(e.type==='mother'){this.status='victory';this.emit('victory');}
 }
 damagePlayer(p,amount){
  if(this.status==='victory'||p.hp<=0||p.invuln>0||p.dashTime>0)return;
  p.hp=Math.max(0,p.hp-amount*this.mult);p.invuln=1;this.combo=0;this.comboTimer=0;this.shake=12;
  this.burst(p.x,p.y,'#ff5a65',18);this.emit('hurt');
  if(p.hp===0){this.label(p.x,p.y,'HERO DOWN','#ff6878',true);this.ring(p.x,p.y,'#ff6878',100);}
  if(this.players.every(q=>q.hp<=0)){this.status='defeat';this.emit('defeat');}
 }
 super(p){
  if(p.charge<100||p.hp<=0)return false;
  p.charge=0;p.invuln=Math.max(p.invuln,2);p.superTime=1.6;this.shake=22;this.emit('super');
  this.label(p.x,p.y-45,p.def.super,p.def.color,true);
  const radius=p.hero==='volt'?720:p.hero==='atlas'?420:560;
  this.ring(p.x,p.y,p.def.color,radius);
  for(const e of [...this.enemies])if(distance(p,e)<radius){
   this.damageEnemy(e,(p.hero==='atlas'?900:p.hero==='volt'?440:650)*p.damageMul,p.id);
   e.timer=-1.5;e.cool+=2;
   if(p.hero==='volt')this.rings.push({x:p.x,y:p.y,x2:e.x,y2:e.y,color:p.def.color,ttl:.5,t:0,lightning:true});
  }
  this.hostile=this.hostile.filter(b=>distance(p,b)>radius);
  this.hazards=this.hazards.filter(b=>distance(p,b)>radius);
  this.burst(p.x,p.y,p.def.color,65,470);return true;
 }
 drop(x,y,type=null){if(!type){const a=this.random();type=a<.24?'health':a<.37?'shield':a<.49?'charge':['scatter','beam','nova','rapid'][Math.floor(this.random()*4)];}
  this.pickups.push({x,y,type,ttl:18,r:17,id:++this.id});}
 collect(p,item){
  if(item.type==='health')p.hp=Math.min(p.maxHp,p.hp+35);
  else if(item.type==='shield')p.invuln=Math.max(p.invuln,7);
  else if(item.type==='charge')p.charge=Math.min(100,p.charge+35);
  else {p.weapon=item.type;p.weaponTime=WEAPONS[item.type].duration;}
  const name=WEAPONS[item.type]?.name||({health:'+35 HEALTH',shield:'7s SHIELD',charge:'+35 SUPER'}[item.type]);
  this.label(p.x,p.y-32,name,'#f6f4df',true);this.ring(p.x,p.y,'#fff',55);this.emit('pickup');
 }
 chooseUpgrade(id){
  if(this.status!=='upgrade'||!this.upgrades.some(u=>u.id===id))return false;
  for(const p of this.players){
   if(id==='damage')p.damageMul*=1.22;
   if(id==='rate')p.rateMul*=1.18;
   if(id==='health'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+50);}
   if(id==='speed'){p.speedMul*=1.12;}
   if(id==='charge'){p.chargeMul*=1.35;p.charge=Math.min(100,p.charge+30);}
   if(id==='pierce')p.pierce++;
   if(p.hp<=0){p.hp=p.maxHp*.5;p.x=WIDTH/2;p.y=HEIGHT/2;p.invuln=4;}
  }
  this.status='playing';this.upgrades=[];this.emit('upgrade');return true;
 }
 chapterChange(next){
  this.chapter=next;const c=CHAPTERS[next];
  this.banner={title:'ISSUE 0'+(next+1)+' / '+c.name,sub:c.sub,ttl:4};this.emit('chapter',{chapter:next});
  if(next<5){const pool=[...UPGRADES];this.upgrades=[];for(let i=0;i<3;i++)this.upgrades.push(pool.splice(Math.floor(this.random()*pool.length),1)[0]);this.status='upgrade';}
 }
 step(dt,inputs=[]){
  if(this.status!=='playing')return;dt=Math.min(dt,.05);this.time+=dt;
  this.shake=Math.max(0,this.shake-dt*38);
  if(this.banner)this.banner.ttl-=dt;
  this.comboTimer=Math.max(0,this.comboTimer-dt);if(!this.comboTimer)this.combo=0;
  const next=Math.min(5,Math.floor(this.time/60));if(next>this.chapter){this.chapterChange(next);if(this.status!=='playing')return;}
  for(const p of this.players){
   const i=inputs[p.id]||{};p.shot-=dt;p.invuln=Math.max(0,p.invuln-dt);p.superTime=Math.max(0,p.superTime-dt);
   p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.dashTime=Math.max(0,p.dashTime-dt);
   p.weaponTime=Math.max(0,p.weaponTime-dt);if(!p.weaponTime)p.weapon=null;
   if(p.hp<=0){const ally=this.players.find(q=>q.hp>0&&distance(p,q)<65);p.revive=ally?p.revive+dt:Math.max(0,p.revive-dt);
    if(p.revive>=2.5){p.hp=p.maxHp*.45;p.invuln=3;p.revive=0;this.label(p.x,p.y,'BACK IN ACTION',p.def.color,true);}continue;}
   p.charge=Math.min(100,p.charge+dt*.38*p.chargeMul);
   let mx=i.moveX||0,my=i.moveY||0,mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;}
   let ax=i.aimX||0,ay=i.aimY||0;if(i.autoAim){const target=this.nearest(p);if(target){ax=target.x-p.x;ay=target.y-p.y;}}
   if(Math.hypot(ax,ay)>.12)p.angle=Math.atan2(ay,ax);
   if(i.dash&&!p.lastDash&&p.dashCooldown<=0){
    p.dashTime=.19;p.dashCooldown=2.5/p.speedMul;let d=mag?Math.atan2(my,mx):p.angle;
    p.dashX=Math.cos(d);p.dashY=Math.sin(d);this.emit('dash');this.burst(p.x,p.y,p.def.color,10,60);
   }
   if(i.super&&!p.lastSuper)this.super(p);p.lastSuper=!!i.super;p.lastDash=!!i.dash;
   if(p.dashTime>0){mx=p.dashX*3.7;my=p.dashY*3.7;}
   const speed=p.def.speed*p.speedMul;p.x=clamp(p.x+mx*speed*dt,35,WIDTH-35);p.y=clamp(p.y+my*speed*dt,35,HEIGHT-35);
   if(mag>0||p.dashTime>0)p.trail.push({x:p.x,y:p.y,a:p.angle,ttl:.16});p.trail=p.trail.filter(t=>(t.ttl-=dt)>0);
   if((i.shoot||i.autoAim)&&p.shot<=0)this.fire(p,p.angle);
  }
  this.spawnClock-=dt;
  if(this.spawnClock<=0){this.spawnClock=Math.max(.22,1.08-this.chapter*.135)/(this.players.length===2?1.4:1);
   const pool=this.chapter===0?['grunt','grunt','grunt','skitter']:this.chapter===1?['grunt','skitter','skitter','spitter']:this.chapter===2?['grunt','brute','charger','splitter']:['grunt','skitter','spitter','charger','splitter','brute'];
   for(let n=0;n<1+Math.floor(this.chapter/2);n++)this.spawn(pool[Math.floor(this.random()*pool.length)]);
  }
  if(this.time>=145&&!this.miniSpawned){this.miniSpawned=true;this.spawn('warden',WIDTH/2,130);}
  if(this.time>=300&&!this.motherSpawned){this.motherSpawned=true;this.spawn('mother',WIDTH/2,140);}
  this.portals=this.portals.filter(p=>{p.ttl-=dt;if(p.ttl<=0){this.spawn(p.type,p.x,p.y,true);return false;}return true;});
  this.buildGrid();
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.age+=dt;e.cool-=dt;
   const target=this.target(e);if(!target)continue;const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;
   e.angle=Math.atan2(dy,dx);let vx=dx/d*e.speed,vy=dy/d*e.speed;
   if(e.timer<0){e.timer=Math.min(0,e.timer+dt);vx=vy=0;}
   else if(e.type==='charger'){
    if(e.phase==='hunt'&&e.cool<=0){e.phase='windup';e.timer=.8;e.vx=dx/d*510;e.vy=dy/d*510;}
    if(e.phase==='windup'){vx=vy=0;e.timer-=dt;if(e.timer<=0){e.phase='dash';e.timer=.65;}}
    else if(e.phase==='dash'){vx=e.vx;vy=e.vy;e.timer-=dt;if(e.timer<=0){e.phase='hunt';e.cool=2.5;}}
   }else if(e.type==='spitter'){
    if(d<310){vx=-vx*.55;vy=-vy*.55;}else if(d<440){vx=vy=0;}
    if(e.cool<=0){this.enemyShot(e,e.angle,200,13);e.cool=2.2;}
   }else if(e.boss){
    if(d<260){vx=-vx*.4;vy=-vy*.4;}
    if(e.cool<=0){
     const count=e.type==='mother'?20:12,phase=e.age*.37;
     for(let n=0;n<count;n++)this.enemyShot(e,n/count*Math.PI*2+phase,e.type==='mother'?165:140,17);
     for(let n=-1;n<=1;n++)this.enemyShot(e,e.angle+n*.16,240,18);
     if(e.type==='mother')for(let n=0;n<2;n++)this.spawn('skitter',e.x+(this.random()-.5)*120,e.y+90);
     this.ring(e.x,e.y,e.color,120);e.cool=e.type==='mother'?1.8:2.7;this.emit('enemyshot');
    }
   }
   if(!e.boss&&e.phase!=='dash'){
    let sx=0,sy=0;for(const other of this.nearby(e.x,e.y,45)){if(other===e||other.hp<=0)continue;const ex=e.x-other.x,ey=e.y-other.y,q=Math.hypot(ex,ey)||.01,over=e.r+other.r-q;if(over>0){sx+=ex/q*over*2;sy+=ey/q*over*2;}}
    vx+=clamp(sx,-80,80);vy+=clamp(sy,-80,80);
   }
   e.x=clamp(e.x+vx*dt,20,WIDTH-20);e.y=clamp(e.y+vy*dt,20,HEIGHT-20);
   for(const p of this.players)if(p.hp>0&&distance(e,p)<e.r+p.r-4)this.damagePlayer(p,e.boss?30:e.type==='brute'?26:16);
  }
  this.buildGrid();
  for(const b of this.bullets){
   b.ttl-=dt;const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
   // Segment collision prevents fast prism bolts passing through small enemies.
   const dx=b.x-ox,dy=b.y-oy,len=dx*dx+dy*dy;
   for(const e of this.nearby((ox+b.x)/2,(oy+b.y)/2,115)){
    if(e.hp<=0||b.hit.has(e.id))continue;
    const t=clamp(((e.x-ox)*dx+(e.y-oy)*dy)/(len||1),0,1);
    if(Math.hypot(e.x-ox-dx*t,e.y-oy-dy*t)>e.r+b.r)continue;
    b.hit.add(e.id);this.damageEnemy(e,b.damage,b.owner);this.burst(b.x,b.y,b.color,2,55);
    if(b.weapon==='nova'){this.ring(b.x,b.y,b.color,110);for(const other of [...this.enemies])if(other!==e&&other.hp>0&&distance(b,other)<110)this.damageEnemy(other,b.damage*.7,b.owner);this.emit('explosion');b.ttl=0;break;}
    if(b.chain){const other=this.nearest(e,145,e);if(other){this.damageEnemy(other,b.damage*.75,b.owner);this.rings.push({x:e.x,y:e.y,x2:other.x,y2:other.y,ttl:.16,t:0,color:'#75eeff',lightning:true});}}
    if(b.pierce--<=0){b.ttl=0;break;}
   }
  }
  this.bullets=this.bullets.filter(b=>b.ttl>0&&b.x>-50&&b.x<WIDTH+50&&b.y>-50&&b.y<HEIGHT+50);
  for(const b of this.hostile){b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
   for(const p of this.players)if(p.hp>0&&distance(p,b)<p.r+b.r){this.damagePlayer(p,b.damage);b.ttl=0;break;}}
  this.hostile=this.hostile.filter(b=>b.ttl>0&&b.x>0&&b.x<WIDTH&&b.y>0&&b.y<HEIGHT);
  this.pickupClock-=dt;if(this.pickupClock<=0){this.pickupClock=13;const p=this.players.find(p=>p.hp>0);if(p)this.drop(clamp(p.x+(this.random()-.5)*350,80,WIDTH-80),clamp(p.y+(this.random()-.5)*280,80,HEIGHT-80),p.hp<p.maxHp*.4?'health':null);}
  this.pickups=this.pickups.filter(item=>{item.ttl-=dt;for(const p of this.players)if(p.hp>0){const d=distance(p,item);if(d<85){item.x+=(p.x-item.x)*dt*6;item.y+=(p.y-item.y)*dt*6;}if(d<p.r+item.r){this.collect(p,item);return false;}}return item.ttl>0;});
  if(this.chapter>=3){this.hazardClock-=dt;if(this.hazardClock<=0){this.hazardClock=this.chapter===5?4:6;const p=this.target({x:WIDTH/2,y:HEIGHT/2});if(p)this.hazards.push({x:p.x,y:p.y,r:82,ttl:2.1,hit:false});}}
  for(const h of this.hazards){h.ttl-=dt;if(h.ttl<.3&&!h.hit){h.hit=true;this.ring(h.x,h.y,'#ec9aff',h.r*1.5);this.burst(h.x,h.y,'#df8bff',26,220);this.emit('explosion');for(const p of this.players)if(distance(h,p)<h.r)this.damagePlayer(p,34);}}
  this.hazards=this.hazards.filter(h=>h.ttl>0);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const p of this.particles){p.ttl-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*3;p.vy*=1-dt*3;}
  this.particles=this.particles.filter(p=>p.ttl>0);
  this.rings=this.rings.filter(r=>{r.t+=dt;r.ttl-=dt;return r.ttl>0;});
  this.labels=this.labels.filter(l=>{l.ttl-=dt;l.y-=dt*25;return l.ttl>0;});
 }
 enemyShot(e,a,s,damage){this.hostile.push({x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ttl:8,damage,r:7,color:e.color});}
 summary(){return {status:this.status,hero:this.players[0].hero,chapter:this.chapter+1,time:Math.floor(this.time),score:this.score,kills:this.kills,bestCombo:this.bestCombo,enemies:this.enemies.length,players:this.players.map(p=>({hero:p.hero,health:Math.ceil(p.hp),maxHealth:p.maxHp,super:Math.floor(p.charge)}))};}
}
