import { clamp } from './engine.mjs';
export class Controls {
 constructor(canvas,renderer,onPause){
  this.canvas=canvas;this.renderer=renderer;this.keys=new Set();this.mouse={x:720,y:350,down:false,seen:false};this.touch={left:null,right:null};this.usingTouch=false;this.padPrev=false;this.buttonDash=false;this.buttonSuper=false;this.listeners=[];
  this.listen(window,'keydown',e=>{if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[role=dialog]'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat)onPause();});
  this.listen(window,'keyup',e=>this.keys.delete(e.code));
  this.listen(window,'blur',()=>this.clear());
  this.listen(canvas,'contextmenu',e=>e.preventDefault());
  this.listen(canvas,'pointerdown',e=>{
   if(e.pointerType==='touch'){this.usingTouch=true;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,key=x<r.width/2?'left':'right';if(!this.touch[key])this.touch[key]={id:e.pointerId,sx:x,sy:y,dx:0,dy:0};}
   else{this.usingTouch=false;this.mouse.down=e.button===0;this.mouse.seen=true;Object.assign(this.mouse,renderer.screenToWorld(e.clientX,e.clientY));}
   canvas.setPointerCapture(e.pointerId);e.preventDefault();
  });
  this.listen(canvas,'pointermove',e=>{
   if(e.pointerType==='touch'){const r=canvas.getBoundingClientRect();for(const s of Object.values(this.touch))if(s?.id===e.pointerId){s.dx=e.clientX-r.left-s.sx;s.dy=e.clientY-r.top-s.sy;}}
   else{this.mouse.seen=true;Object.assign(this.mouse,renderer.screenToWorld(e.clientX,e.clientY));}
  });
  const up=e=>{for(const k of ['left','right'])if(this.touch[k]?.id===e.pointerId)this.touch[k]=null;if(e.pointerType!=='touch')this.mouse.down=false;};
  this.listen(canvas,'pointerup',up);this.listen(canvas,'pointercancel',up);this.listen(canvas,'lostpointercapture',up);
  this.onPause=onPause;
 }
 listen(target,type,handler){target.addEventListener(type,handler,{passive:false});this.listeners.push(()=>target.removeEventListener(type,handler));}
 clear(){this.keys.clear();this.mouse.down=false;this.touch.left=null;this.touch.right=null;this.buttonDash=false;this.buttonSuper=false;this.padPrev=false;}
 read(world,autoAim=false){
  const k=this.keys,p=world.players[0],l=this.touch.left,r=this.touch.right;
  let result=[{moveX:(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0),moveY:(k.has('KeyS')?1:0)-(k.has('KeyW')?1:0),
   aimX:this.mouse.x-p.x,aimY:this.mouse.y-p.y,shoot:this.mouse.down,
   dash:k.has('Space')||k.has('ShiftLeft')||this.buttonDash,super:k.has('KeyE')||k.has('KeyQ')||this.buttonSuper,autoAim}];
  const arrows=(k.has('ArrowRight')?1:0)-(k.has('ArrowLeft')?1:0),ary=(k.has('ArrowDown')?1:0)-(k.has('ArrowUp')?1:0);
  if(arrows||ary){result[0].aimX=arrows;result[0].aimY=ary;result[0].shoot=true;}
  if(l){const d=Math.max(45,Math.hypot(l.dx,l.dy));result[0].moveX=l.dx/d;result[0].moveY=l.dy/d;}
  if(r){result[0].aimX=r.dx;result[0].aimY=r.dy;result[0].shoot=Math.hypot(r.dx,r.dy)>8;}
  const pads=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).filter(Boolean):[];
  for(let n=0;n<world.players.length;n++){const pad=world.players.length===2?(n===1?pads[0]:null):pads[0];if(!pad)continue;
   const dead=v=>Math.abs(v||0)<.18?0:v;const rx=dead(pad.axes[2]),ry=dead(pad.axes[3]);
   const start=!!pad.buttons[9]?.pressed;if(start&&!this.padPrev)this.onPause();this.padPrev=start;
   const data={moveX:dead(pad.axes[0]),moveY:dead(pad.axes[1]),aimX:rx,aimY:ry,shoot:Math.hypot(rx,ry)>.18||!!pad.buttons[7]?.pressed,dash:!!pad.buttons[0]?.pressed||!!pad.buttons[4]?.pressed,super:!!pad.buttons[2]?.pressed||!!pad.buttons[5]?.pressed,autoAim};
   if(n===1||Object.entries(data).some(([key,value])=>key!=='autoAim'&&value))result[n]=data;
  }
  return result;
 }
 dispose(){this.listeners.forEach(fn=>fn());this.clear();}
}
