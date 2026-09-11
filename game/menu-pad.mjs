// Pure menu input: sample continuously so held gameplay buttons cannot confirm a new dialog.
export class MenuPad {
 constructor(){this.buttons=[];this.x=0;this.y=0;this.nextX=0;this.nextY=0;}
 sample(pad,now){
  const down=i=>!!pad?.buttons?.[i]?.pressed;
  const edge=i=>down(i)&&!this.buttons[i];
  let x=down(15)?1:down(14)?-1:Math.abs(pad?.axes?.[0]||0)>.55?Math.sign(pad.axes[0]):0;
  let y=down(13)?1:down(12)?-1:Math.abs(pad?.axes?.[1]||0)>.55?Math.sign(pad.axes[1]):0;
  const out={horizontal:0,vertical:0,confirm:edge(0),back:edge(1),help:edge(2),coop:edge(3)};
  for(const [axis,value,key]of [['x',x,'horizontal'],['y',y,'vertical']]){
   const next=axis==='x'?'nextX':'nextY';
   if(value&&(value!==this[axis]||now>=this[next])){out[key]=value;this[next]=now+(value!==this[axis]?440:180);}
   this[axis]=value;
  }
  this.buttons=Array.from({length:16},(_,i)=>down(i));return out;
 }
}
