import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../game/engine.mjs';
import {Controls} from '../game/input.mjs';
class Surface{
 constructor(){this.events={};}
 addEventListener(t,f){(this.events[t]??=[]).push(f);}
 removeEventListener(t,f){this.events[t]=(this.events[t]||[]).filter(x=>x!==f);}
 dispatch(t,e={}){for(const fn of this.events[t]||[])fn({preventDefault(){},...e});}
 getBoundingClientRect(){return {left:0,top:0,width:1000,height:600};}
 setPointerCapture(){}
}
globalThis.window=new Surface();globalThis.HTMLElement=class{};
let pads=[];Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>pads},configurable:true});
const setup=()=>{const canvas=new Surface(),renderer={screenToWorld:(x,y)=>({x,y})};let pauses=0;const c=new Controls(canvas,renderer,()=>pauses++);return {canvas,c,pauses:()=>pauses};};
test('keyboard and mouse map movement, fire, dash and super; blur clears holds',()=>{
 pads=[];const {c,canvas}=setup();const w=new World();
 window.dispatch('keydown',{code:'KeyD'});window.dispatch('keydown',{code:'Space'});window.dispatch('keydown',{code:'KeyE'});
 canvas.dispatch('pointerdown',{pointerType:'mouse',button:0,pointerId:1,clientX:800,clientY:400});
 let i=c.read(w)[0];assert.equal(i.moveX,1);assert.ok(i.shoot&&i.dash&&i.super);assert.ok(i.aimX>0);
 window.dispatch('blur');i=c.read(w)[0];assert.equal(i.moveX,0);assert.equal(i.shoot,false);assert.equal(i.dash,false);c.dispose();
});
test('two touch pointers work independently and cancel without sticking',()=>{
 pads=[];const {c,canvas}=setup();const w=new World();
 canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:1,clientX:100,clientY:450});
 canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:2,clientX:800,clientY:450});
 canvas.dispatch('pointermove',{pointerType:'touch',pointerId:1,clientX:145,clientY:450});
 canvas.dispatch('pointermove',{pointerType:'touch',pointerId:2,clientX:800,clientY:400});
 let i=c.read(w)[0];assert.equal(i.moveX,1);assert.equal(i.aimY,-50);assert.equal(i.shoot,true);
 canvas.dispatch('pointercancel',{pointerType:'touch',pointerId:2});i=c.read(w)[0];assert.equal(i.shoot,false);assert.equal(i.moveX,1);
 canvas.dispatch('pointerup',{pointerType:'touch',pointerId:1});assert.equal(c.read(w)[0].moveX,0);c.dispose();
});
const pad=()=>({axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))});
test('controller maps both sticks and abilities; Menu triggers on edges only',()=>{
 const p=pad();pads=[p];const {c,pauses}=setup();const w=new World();p.axes=[.6,-.8,1,0];p.buttons[0].pressed=true;p.buttons[2].pressed=true;
 const i=c.read(w)[0];assert.equal(i.moveX,.6);assert.equal(i.moveY,-.8);assert.equal(i.aimX,1);assert.ok(i.shoot&&i.dash&&i.super);
 p.buttons[9].pressed=true;c.read(w);c.read(w);assert.equal(pauses(),1);p.buttons[9].pressed=false;c.read(w);p.buttons[9].pressed=true;c.read(w);assert.equal(pauses(),2);c.dispose();
});
test('co-op assigns the first controller to Player 2 and idle pads preserve keyboard',()=>{
 const p=pad();pads=[p];const {c}=setup();const w=new World({coop:true});window.dispatch('keydown',{code:'KeyA'});p.axes=[1,0,0,1];
 const a=c.read(w);assert.equal(a[0].moveX,-1);assert.equal(a[1].moveX,1);assert.equal(a[1].aimY,1);
 p.axes=[0,0,0,0];const solo=new World();const b=c.read(solo,true)[0];assert.equal(b.moveX,-1);assert.equal(b.autoAim,true);c.dispose();
});
