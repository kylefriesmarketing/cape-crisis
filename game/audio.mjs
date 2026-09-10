import { CHAPTERS } from './engine.mjs';
export class AudioDirector{
 constructor(){this.ctx=null;this.music=true;this.effects=true;this.active=false;this.step=0;this.next=0;this.chapter=0;this.lastShot=0;this.timer=null;}
 async unlock(){if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.65;const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=6;this.master.connect(comp);comp.connect(this.ctx.destination);
 this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 }if(this.ctx.state==='suspended')await this.ctx.resume();if(!this.timer)this.timer=setInterval(()=>this.schedule(),25);}
 tone(freq,dur,type='sine',vol=.12,when=null,end=null){
  if(!this.ctx)return;const t=when??this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(12,end),t+dur);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(Math.max(.002,vol),t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 noiseHit(dur,vol,freq,when=null){if(!this.ctx)return;const t=when??this.ctx.currentTime,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type='highpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+dur);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 setState(active,chapter=0){if(active&&!this.active&&this.ctx)this.next=this.ctx.currentTime+.04;this.active=active;this.chapter=chapter;}
 schedule(){
  if(!this.ctx||!this.active||!this.music)return;
  if(this.next<this.ctx.currentTime-.1)this.next=this.ctx.currentTime+.02;
  const bpm=CHAPTERS[this.chapter].bpm;
  while(this.next<this.ctx.currentTime+.11){const s=this.step++%64,t=this.next,c=this.chapter;
   const root=[55,65.406,48.999,73.416][Math.floor(s/16)%4];
   if(s%4===0||c>2&&s%16===14)this.tone(130,.22,'sine',.32,t,38);
   if(s%8===4){this.noiseHit(.14,.16,1000,t);this.tone(190,.09,'triangle',.12,t,80);}
   if(s%2===0)this.noiseHit(s%8===6?.13:.035,s%4===0?.045:.07,6800,t);
   if(s%2===0){const note=[0,0,7,0,10,7,0,12][Math.floor(s/2)%8];const f=root*2**(note/12);this.tone(f,.14,'sawtooth',.11,t);this.tone(f*1.006,.13,'square',.025,t);}
   if(c>=1&&s%4===2){const melody=[12,19,22,19,15,12,10,7,12,15,19,24,22,19,15,10];this.tone(root*2**(melody[Math.floor(s/4)]/12)*2,.17,c>=3?'sawtooth':'triangle',.052,t);}
   if(c===2||c===4){if(s%8===0){this.tone(root*2,.35,'sawtooth',.055,t);this.tone(root*3,.35,'sawtooth',.035,t);}}
   this.next+=60/bpm/4;
  }
 }
 event(e){if(!this.ctx||!this.effects)return;const t=this.ctx.currentTime;
  if(e.type==='shot'){if(t-this.lastShot<.065)return;this.lastShot=t;this.tone(e.weapon==='nova'?170:e.hero==='volt'?780:440,.07,'sawtooth',.035,null,e.weapon==='nova'?50:130);}
  if(e.type==='hurt'){this.noiseHit(.18,.13,200);this.tone(110,.2,'sawtooth',.1,null,40);}
  if(e.type==='dash')this.noiseHit(.13,.09,1900);
  if(e.type==='explosion'){this.noiseHit(.26,.15,180);this.tone(95,.28,'sine',.16,null,25);}
  if(e.type==='pickup'||e.type==='upgrade'||e.type==='combo'){[523,659,784].forEach((f,i)=>this.tone(f,.12,'triangle',.07,t+i*.065));}
  if(e.type==='super'){this.noiseHit(.8,.19,500);this.tone(70,.85,'sawtooth',.12,t,640);[220,330,440].forEach((f,i)=>this.tone(f,.7,'triangle',.09,t+i*.05));}
  if(e.type==='boss'){this.tone(65,.9,'sawtooth',.1);this.tone(69,.9,'sawtooth',.08);}
  if(e.type==='victory'){[261,329,392,523,659,784,1046].forEach((f,i)=>this.tone(f,.5,'triangle',.11,t+i*.12));}
  if(e.type==='defeat'){[220,196,164,110].forEach((f,i)=>this.tone(f,.45,'sawtooth',.07,t+i*.2));}
 }
 dispose(){clearInterval(this.timer);this.timer=null;this.active=false;this.ctx?.close();this.ctx=null;}
}
