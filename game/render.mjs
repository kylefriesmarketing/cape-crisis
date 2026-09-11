import { WIDTH,HEIGHT,CHAPTERS,WEAPONS,clamp } from './engine.mjs';
const TAU=Math.PI*2;
function polygon(c,points,fill,stroke='#0b111b',width=3){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function circle(c,x,y,r,fill,stroke=null,lw=2){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.scale=1;this.ox=0;this.oy=0;this.w=0;this.h=0;this.background=this.makeBackground();}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2);if(r.width===this.w&&r.height===this.h&&this.dpr===dpr)return;this.w=r.width;this.h=r.height;this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.dpr=dpr;this.scale=Math.min(this.w/WIDTH,this.h/HEIGHT);this.ox=(this.w-WIDTH*this.scale)/2;this.oy=(this.h-HEIGHT*this.scale)/2;}
 screenToWorld(x,y){const r=this.canvas.getBoundingClientRect();return {x:(x-r.left-this.ox)/this.scale,y:(y-r.top-this.oy)/this.scale};}
 makeBackground(){
  const cv=document.createElement('canvas');cv.width=WIDTH;cv.height=HEIGHT;const c=cv.getContext('2d');
  c.fillStyle='#101923';c.fillRect(0,0,WIDTH,HEIGHT);
  const g=c.createRadialGradient(WIDTH/2,HEIGHT/2,50,WIDTH/2,HEIGHT/2,820);g.addColorStop(0,'#24333c');g.addColorStop(1,'#111a24');c.fillStyle=g;c.fillRect(0,0,WIDTH,HEIGHT);
  // An overhead city plaza, with clear open lanes for twin-stick movement.
  c.fillStyle='#111923';c.fillRect(0,HEIGHT/2-86,WIDTH,172);c.fillRect(WIDTH/2-95,0,190,HEIGHT);
  c.strokeStyle='#384248';c.lineWidth=2;c.strokeRect(92,86,WIDTH-184,HEIGHT-172);
  c.strokeStyle='#87947d';c.globalAlpha=.19;c.lineWidth=3;c.setLineDash([24,30]);c.beginPath();c.moveTo(0,HEIGHT/2);c.lineTo(WIDTH,HEIGHT/2);c.moveTo(WIDTH/2,0);c.lineTo(WIDTH/2,HEIGHT);c.stroke();c.setLineDash([]);c.globalAlpha=1;
  c.strokeStyle='#607277';c.globalAlpha=.095;c.lineWidth=1;
  for(let x=0;x<WIDTH;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,HEIGHT);c.stroke();}
  for(let y=0;y<HEIGHT;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(WIDTH,y);c.stroke();}
  c.globalAlpha=.15;c.strokeStyle='#87968a';c.lineWidth=2;circle(c,WIDTH/2,HEIGHT/2,145,null,'#95a791');circle(c,WIDTH/2,HEIGHT/2,137,null,'#95a791');
  c.save();c.translate(WIDTH/2,HEIGHT/2);c.rotate(-.12);const star=[];for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=n%2?43:105;star.push([Math.cos(a)*r,Math.sin(a)*r]);}polygon(c,star,null,'#95a791',4);c.restore();c.globalAlpha=1;
  // Paint on the ground has no collision: the whole plaza remains navigable.
  c.save();c.translate(230,735);c.rotate(-Math.PI/2);c.fillStyle='#6a7872';c.globalAlpha=.23;c.font='bold 25px monospace';c.fillText('NOVA CITY',0,0);c.restore();
  for(let n=0;n<70;n++){const x=(n*331.7)%WIDTH,y=(n*719.3)%HEIGHT;c.strokeStyle=n%2?'#657477':'#0a1119';c.globalAlpha=.2;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+8+(n%17),y+9);c.lineTo(x+29,y+6);c.stroke();}
  c.globalAlpha=1;
  for(const [x,y] of [[30,30],[WIDTH-110,30],[30,HEIGHT-70],[WIDTH-110,HEIGHT-70]]){c.fillStyle='#131d29';c.fillRect(x,y,80,40);c.strokeStyle='#334451';c.strokeRect(x+2,y+2,76,36);c.fillStyle='#93c6c7';c.globalAlpha=.25;c.fillRect(x+14,y+9,52,3);c.globalAlpha=1;}
  return cv;
 }
 render(g,{shake=true,touch=null,aim=null}={}){
  this.resize();const c=this.ctx;if(!c||!this.w)return;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#070d14';c.fillRect(0,0,this.w,this.h);
  c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
  c.save();c.beginPath();c.rect(0,0,WIDTH,HEIGHT);c.clip();
  if(shake&&g.shake>0)c.translate(Math.sin(g.time*121)*g.shake*.5,Math.cos(g.time*107)*g.shake*.4);
  c.drawImage(this.background,0,0);
  const color=CHAPTERS[g.chapter].color;
  c.strokeStyle=color;c.globalAlpha=.15+Math.sin(g.time*2)*.03;c.lineWidth=2;c.strokeRect(18,18,WIDTH-36,HEIGHT-36);
  c.fillStyle=color;for(let x=60;x<WIDTH;x+=130){c.fillRect(x,17,28,3);c.fillRect(x,HEIGHT-20,28,3);}c.globalAlpha=1;
  for(const mark of g.decals||[]){
   c.globalAlpha=Math.min(.2,mark.ttl*.03);c.save();c.translate(mark.x,mark.y);c.rotate(mark.angle);
   c.fillStyle=mark.color;c.beginPath();c.ellipse(0,0,mark.r*1.4,mark.r*.65,0,0,TAU);c.fill();c.restore();c.globalAlpha=1;
  }
  // Chapter lighting changes the atmosphere while retaining the same readable arena.
  c.globalAlpha=.035;c.fillStyle=color;c.fillRect(0,0,WIDTH,HEIGHT);c.globalAlpha=1;
  for(const h of g.hazards){
   if(h.type==='beam'){
    c.save();c.translate(h.x,h.y);c.rotate(h.angle);
    const active=h.hit,ratio=clamp(1-(h.ttl-h.active)/h.windup,0,1);
    c.fillStyle=active?'#db8fff77':'#bd73ff18';c.fillRect(0,-h.width/2,h.length,h.width);
    c.strokeStyle=active?'#eed0ff':'#dc9cff';c.lineWidth=active?5:1.5;
    c.setLineDash(active?[]:[14,12]);c.strokeRect(0,-h.width/2,h.length,h.width);c.setLineDash([]);
    c.fillStyle=active?'#fff3ff':'#d4a9ff55';c.fillRect(0,-(active?6:ratio*5),h.length,active?12:ratio*10);c.restore();
    continue;
   }
   if(h.type==='shockwave'){
    if(h.hit){circle(c,h.x,h.y,h.radius,null,'#ffd78a',h.width*2);circle(c,h.x,h.y,h.radius,null,'#fff1c1',3);}
    else {circle(c,h.x,h.y,75+15*clamp(1-(h.ttl-h.active)/h.windup,0,1),'#ffcb771a','#f7c56e',2);c.fillStyle='#fbd292';c.textAlign='center';c.font='bold 15px monospace';c.fillText('DASH THE RING',h.x,h.y-100);}
    continue;
   }
   const ratio=clamp(1-(h.ttl-(h.active??.3))/(h.windup??1.8),0,1);circle(c,h.x,h.y,h.r,'#d066ff12','#e596ff',2);
   circle(c,h.x,h.y,h.r*ratio,null,'#e596ff',3);
   c.fillStyle='#edb5ff';c.font='bold 20px monospace';c.textAlign='center';c.fillText('!',h.x,h.y+7);
   if(h.hit){c.globalAlpha=.55;c.fillStyle='#eee0ff';c.fillRect(h.x-20,0,40,h.y);c.globalAlpha=1;}
  }
  for(const p of g.portals){
   const r=p.type==='mother'?90:p.type==='warden'?65:24;
   c.save();c.translate(p.x,p.y);c.rotate(g.time*2);c.globalAlpha=.55;
   circle(c,0,0,r*(.75+Math.sin(g.time*13)*.13),'#a2eb6320','#b4f563',2);
   c.strokeStyle='#d9ff9f';c.lineWidth=4;c.beginPath();c.arc(0,0,r,0,Math.PI*.7);c.stroke();c.beginPath();c.arc(0,0,r,Math.PI,Math.PI*1.7);c.stroke();c.restore();
  }
  for(const item of g.pickups)this.pickup(c,item,g.time,g.players.some(p=>p.hp>0&&Math.hypot(item.x-p.x,item.y-p.y)<180));
  for(const p of g.players)for(const t of p.trail){c.globalAlpha=t.ttl*1.5;this.hero(c,{...p,x:t.x,y:t.y,angle:t.a},g.time,true);c.globalAlpha=1;}
  const sorted=[...g.enemies,...g.players.map(p=>({...p,isPlayer:true}))].sort((a,b)=>a.y-b.y);
  for(const e of sorted){if(e.isPlayer)this.hero(c,e,g.time);else this.alien(c,e,g.time);}
  c.save();c.globalCompositeOperation='lighter';
  for(const b of g.bullets){
   c.strokeStyle=b.color;c.lineWidth=b.r*2;c.lineCap='round';c.beginPath();c.moveTo(b.x,b.y);const length=b.weapon==='beam'?.04:.017;c.lineTo(b.x-b.vx*length,b.y-b.vy*length);c.stroke();
   c.strokeStyle='#fffce6';c.lineWidth=b.r*.7;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*.009,b.y-b.vy*.009);c.stroke();
  }
  for(const b of g.hostile){circle(c,b.x,b.y,12,b.color+'25');circle(c,b.x,b.y,b.r,b.color);circle(c,b.x,b.y,3,'#fff2d9');}
  for(const p of g.particles){c.globalAlpha=clamp(p.ttl/.45,0,1);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.r,p.r);}
  c.globalAlpha=1;
  for(const r of g.rings){c.globalAlpha=clamp(r.ttl*2.2,0,1);
   if(r.lightning){c.strokeStyle=r.color;c.lineWidth=3;c.beginPath();c.moveTo(r.x,r.y);for(let n=1;n<=5;n++){const f=n/5;c.lineTo(r.x+(r.x2-r.x)*f+(n<5?Math.sin(n*31+r.t*54)*18:0),r.y+(r.y2-r.y)*f+(n<5?Math.cos(n*13+r.t*54)*18:0));}c.stroke();}
   else circle(c,r.x,r.y,Math.max(2,r.r*(1-(1-clamp(r.t/.55,0,1))**3)),null,r.color,Math.max(1,8*r.ttl));
  }c.restore();
  for(const p of g.players)if(p.superTime>0){c.globalAlpha=Math.min(.16,p.superTime*.12);circle(c,p.x,p.y,130,p.def.color);c.globalAlpha=1;}
  c.textAlign='center';
  for(const l of g.labels){c.globalAlpha=clamp(l.ttl*3,0,1);c.font=l.big?'italic 900 28px Impact, sans-serif':'bold 14px monospace';c.lineWidth=4;c.strokeStyle='#0a111b';c.strokeText(l.text,l.x,l.y);c.fillStyle=l.color;c.fillText(l.text,l.x,l.y);c.globalAlpha=1;}
  if(aim&&g.status==='playing'){c.strokeStyle='#faf7e5';c.lineWidth=1.5;circle(c,aim.x,aim.y,11,null,'#faf7e5');for(let i=0;i<4;i++){let a=i*TAU/4;c.beginPath();c.moveTo(aim.x+Math.cos(a)*7,aim.y+Math.sin(a)*7);c.lineTo(aim.x+Math.cos(a)*17,aim.y+Math.sin(a)*17);c.stroke();}}
  if(g.banner&&g.banner.ttl>0){const opacity=clamp(g.banner.ttl,0,1)*.85;c.globalAlpha=opacity;c.fillStyle='#08101bdd';c.fillRect(WIDTH/2-350,118,700,77);
   c.fillStyle=color;c.font='italic 900 29px Impact, sans-serif';c.fillText(g.banner.title,WIDTH/2,151);
   c.fillStyle='#eef0e6';c.font='15px monospace';c.fillText(g.banner.sub,WIDTH/2,177);c.globalAlpha=1;
  }
  if(g.damageFlash>0&&shake){c.globalAlpha=g.damageFlash*.85;c.strokeStyle='#ff586b';c.lineWidth=30;c.strokeRect(0,0,WIDTH,HEIGHT);c.globalAlpha=1;}
  c.restore();
  // Touch thumbsticks are drawn in screen space to work with any letterboxing.
  if(touch){c.setTransform(this.dpr,0,0,this.dpr,0,0);for(const stick of Object.values(touch)){if(!stick)continue;circle(c,stick.sx,stick.sy,50,'#07121b55','#c7eceb55');circle(c,stick.sx+clamp(stick.dx,-42,42),stick.sy+clamp(stick.dy,-42,42),21,'#c7eceb44','#c7eceb99');}}
 }
 hero(c,p,time,ghost=false){
  c.save();c.translate(p.x,p.y);
  if(p.hp<=0){circle(c,0,0,27,'#ff627222','#ff7383');c.fillStyle='#ffc0c3';c.font='bold 20px monospace';c.textAlign='center';c.fillText('+',0,7);c.font='12px monospace';c.fillText('REVIVE',0,43);if(p.revive>0){c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(0,0,30,-Math.PI/2,-Math.PI/2+p.revive/2.5*TAU);c.stroke();}c.restore();return;}
  circle(c,0,8,20,'#05091177');
  if(!ghost){
   circle(c,0,0,24,null,p.def.color+'55',1.5);
   if(p.dashTime>0){c.save();c.rotate(Math.atan2(p.dashY,p.dashX));c.strokeStyle=p.def.color;c.lineWidth=p.hero==='atlas'?7:3;c.beginPath();c.arc(7,0,p.hero==='volt'?48:31,-1.1,1.1);c.stroke();c.restore();}
  }
  if(p.invuln>0&&!ghost){circle(c,0,0,30,null,p.def.color+'99',2);if(p.invuln<1&&Math.floor(time*16)%2)c.globalAlpha=.55;}
  c.rotate(p.angle);const color=p.def.color,wiggle=Math.sin(time*14)*5;
  polygon(c,[[-8,-12],[-37,-18+wiggle],[-28,1],[-39,18+wiggle],[-7,13]],color,'#0b1018',2);
  polygon(c,[[-13,-11],[4,-15],[14,-7],[14,7],[4,15],[-13,11]],p.hero==='atlas'?'#dbaa44':'#dce7e1');
  polygon(c,[[-8,-8],[6,-10],[11,0],[6,10],[-8,8]],color,'#132334',2);
  c.fillStyle='#d6dfda';c.fillRect(-1,-20,18,8);c.fillRect(-1,12,18,8);
  c.fillStyle=color;c.fillRect(10,-21,9,10);c.fillRect(10,11,9,10);
  circle(c,9,0,10,p.hero==='atlas'?'#fff0a6':'#f3dcc6','#101827',2);
  polygon(c,[[9,-9],[15,-6],[16,6],[9,9]],color,'#101827',1.5);
  c.fillStyle='#fafff2';c.fillRect(12,-6,3,4);c.fillRect(12,2,3,4);
  if(p.shot>p.def.rate*.65){c.globalAlpha=.7;polygon(c,[[20,-4],[35,-9],[30,-1],[40,3],[23,5]],'#fff6c9',null);}
  c.restore();
  if(!ghost){c.fillStyle='#0a111ddd';c.fillRect(p.x-20,p.y+27,40,4);c.fillStyle=p.hp/p.maxHp<.3?'#ff6878':color;c.fillRect(p.x-20,p.y+27,40*p.hp/p.maxHp,4);
   if(p.id){c.fillStyle='#9beaff';c.font='bold 12px monospace';c.textAlign='center';c.fillText('P2',p.x,p.y-36);}
  }
 }
 alien(c,e,time){
  if(e.hp<=0)return;c.save();c.translate(e.x,e.y);const r=e.r;
  c.scale(1+Math.sin(time*5+e.id)*.025,1+Math.cos(time*5+e.id)*.025);
  circle(c,0,r*.37,r*.95,'#060b1390');
  if(e.type==='mother'){
   c.save();c.rotate(time*.25);
   for(let i=0;i<8;i++){const a=i/8*TAU;polygon(c,[[Math.cos(a)*r*.7,Math.sin(a)*r*.7],[Math.cos(a+.12)*r*1.28,Math.sin(a+.12)*r*1.28],[Math.cos(a+.25)*r*.75,Math.sin(a+.25)*r*.75]],'#728365','#090e16',3);}
   c.restore();circle(c,0,0,r,e.hit?'#fff8e8':'#283c39','#090f16',5);circle(c,0,0,r*.78,'#556d4b','#d0f284',2);
   for(let i=0;i<10;i++){let a=i/10*TAU+time*.6;circle(c,Math.cos(a)*r*.88,Math.sin(a)*r*.88,5,'#d9ffa7');}
   circle(c,0,0,r*.52,'#172c30','#92d866',4);circle(c,0,0,r*.36,'#b5e9a455');
   c.rotate(e.angle);polygon(c,[[-15,-22],[25,-14],[30,0],[25,14],[-15,22],[-25,0]],'#b4ee80','#112e22',3);c.fillStyle='#102719';c.fillRect(5,-13,14,8);c.fillRect(5,5,14,8);
  }else if(e.type==='warden'){
   c.rotate(e.angle);polygon(c,[[-r,-r*.6],[-r*.4,-r],[r*.65,-r*.65],[r,0],[r*.65,r*.65],[-r*.4,r],[-r,r*.6]],e.hit?'#fff': '#56626e','#090f18',5);
   c.fillStyle='#dc9853';c.fillRect(-r*.6,-r*1.1,r*.9,r*.45);c.fillRect(-r*.6,r*.65,r*.9,r*.45);
   circle(c,r*.15,0,r*.55,'#181e2c','#f8bb6c',3);circle(c,r*.2,0,r*.25,'#ffe587');c.fillStyle='#121b2b';c.fillRect(r*.25,-12,17,7);c.fillRect(r*.25,5,17,7);
  }else{
   if(e.type==='charger'&&e.phase==='windup'){c.save();c.rotate(Math.atan2(e.vy,e.vx));c.globalAlpha=.3;c.fillStyle='#ff8194';c.fillRect(0,-8,400,16);c.restore();}
   c.rotate(e.angle);const wobble=Math.sin(time*(e.type==='skitter'?23:12)+e.id)*5;
   c.strokeStyle='#111c21';c.lineWidth=5;c.lineCap='round';
   for(let n=-1;n<=1;n+=2){c.beginPath();c.moveTo(-5,n*r*.5);c.lineTo(-r*.75+wobble,n*r);c.lineTo(-r*1.05,n*r*.9);c.stroke();}
   let fill=e.hit?'#fefee1':e.color;
   if(e.type==='brute'){polygon(c,[[-r,-r*.65],[-r*.3,-r],[r*.5,-r*.8],[r,0],[r*.5,r*.8],[-r*.3,r],[-r,r*.65]],fill,'#0a1619',3);polygon(c,[[-r*.8,-r*.5],[0,-r*.85],[r*.1,r*.85],[-r*.8,r*.5]],'#65506f',null);}
   else if(e.type==='skitter'){polygon(c,[[-r*1.3,-r*.7],[r*.4,-r],[r*1.05,0],[r*.4,r],[-r*1.3,r*.7],[-r*.6,0]],fill,'#0b1d24',3);}
   else {c.fillStyle=fill;c.beginPath();c.ellipse(0,0,r*.95,r,0,0,TAU);c.fill();c.strokeStyle='#0b201c';c.lineWidth=3;c.stroke();}
   if(e.type==='splitter'){for(let n=0;n<3;n++)circle(c,-r*.45,(-1+n)*r*.55,5,'#e6ff9b','#233e25',1);}
   if(e.type==='spitter'){circle(c,r*.65,0,r*.5,'#ffe68e','#514921');c.fillStyle='#172221';c.fillRect(r*.5,-4,r*.65,8);}
   else {c.fillStyle='#102421';c.beginPath();c.ellipse(r*.25,-r*.36,r*.32,r*.18,-.4,0,TAU);c.fill();c.beginPath();c.ellipse(r*.25,r*.36,r*.32,r*.18,.4,0,TAU);c.fill();c.fillStyle='#f4ffdf';circle(c,r*.32,-r*.4,2,'#ebffd8');circle(c,r*.32,r*.4,2,'#ebffd8');}
  }
  c.restore();
  if(e.enraged){c.strokeStyle='#ff956c';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,e.r+7,-Math.PI/2,Math.PI*1.5);c.stroke();}
  if(!e.boss&&e.hp<e.maxHp&&e.maxHp>70){c.fillStyle='#09111b';c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,3);c.fillStyle=e.color;c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*e.hp/e.maxHp,3);}
 }
 pickup(c,p,t,showName=false){
  const colors={health:'#ff7888',shield:'#71d8ff',charge:'#ebdc79'},symbols={health:'+',shield:'O',charge:'S',beam:'/',nova:'*',scatter:'W',rapid:'>>'};
  const color=WEAPONS[p.type]?.color||colors[p.type];const y=p.y+Math.sin(t*4+p.id)*4;
  c.save();c.translate(p.x,y);c.rotate(Math.PI/4);c.fillStyle='#071520';c.strokeStyle=color;c.lineWidth=2;c.globalAlpha=p.ttl<3?.5+Math.sin(t*12)*.4:1;c.fillRect(-15,-15,30,30);c.strokeRect(-15,-15,30,30);c.rotate(-Math.PI/4);c.fillStyle=color;c.font='bold 19px monospace';c.textAlign='center';c.fillText(symbols[p.type],0,7);c.restore();
  if(showName){const name=WEAPONS[p.type]?.name||{health:'HEALTH +35',shield:'SHIELD',charge:'SUPER ENERGY'}[p.type];
   c.save();c.font='bold 13px monospace';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#09131f';c.strokeText(name,p.x,y+34);c.fillStyle=color;c.fillText(name,p.x,y+34);c.restore();}

 }
}
