'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Check, Crosshair, Expand, Gamepad2, Heart, Hexagon, Music2, Pause, Play, Settings2, Shield, Sparkles, Sun, Trophy, Volume2, Wind, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { World, HEROES, CHAPTERS, WEAPONS, DASHES, UPGRADES } from '@/game/engine.mjs';
import { Renderer } from '@/game/render.mjs';
import { Controls } from '@/game/input.mjs';
import { AudioDirector } from '@/game/audio.mjs';
import { MenuPad } from '@/game/menu-pad.mjs';
const icons={solar:Sun,volt:Zap,atlas:Hexagon,crosshair:Crosshair,zap:Zap,heart:Heart,wind:Wind,sun:Sun,arrow:ArrowRight};
function localStorageSafeMotion(){try{return !!localStorage.getItem('cape-crisis-prefs')||!window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return true;}}
const defaults={music:true,effects:true,shake:true,autoAim:false};
const clock=s=>Math.floor(s/60).toString().padStart(2,'0')+':'+Math.floor(s%60).toString().padStart(2,'0');
const num=n=>Math.floor(n||0).toLocaleString();
const snapshot=g=>({...g.summary(),players:g.players.map(p=>({...p})),boss:g.enemies.find(e=>e.boss),combo:g.combo,comboTimer:g.comboTimer,progress:g.inputProgress,elapsed:g.time,acquired:g.acquired,upgrades:g.upgrades});
export default function Home(){
 const canvas=useRef(null),runtime=useRef(null),actions=useRef({}),prefsRef=useRef(defaults),prefsReady=useRef(false);
 const [upgradeCursor,setUpgradeCursor]=useState(0),[pauseCursor,setPauseCursor]=useState(0),[settingsCursor,setSettingsCursor]=useState(0);
 const [view,setView]=useState('menu'),[hero,setHero]=useState('solar'),[difficulty,setDifficulty]=useState('normal');
 const [prefs,setPrefs]=useState(defaults),[settings,setSettings]=useState(false),[help,setHelp]=useState(false);
 const [best,setBest]=useState(0),[hud,setHud]=useState(null),[coop,setCoop]=useState(false),[padCount,setPadCount]=useState(0),[notice,setNotice]=useState(''),[touchMode,setTouchMode]=useState(false);
 function sync(g){setHud(snapshot(g));setView(g.status);}
 function menuInput(i){
  if(!i)return;
  if(help){if(i.back||i.confirm)setHelp(false);return;}
  if(settings){
   if(i.vertical)setSettingsCursor(n=>(n+i.vertical+5)%5);
   if(i.confirm){const key=['music','effects','shake','autoAim'][settingsCursor];if(key)setting(key,!prefs[key]);else fullscreen();}
   if(i.back)setSettings(false);return;
  }
  const state=runtime.current?.world?.status||'menu';
  if(state==='menu'){
   if(i.horizontal)setHero(h=>HEROES[(HEROES.findIndex(x=>x.id===h)+i.horizontal+HEROES.length)%HEROES.length].id);
   if(i.vertical)setDifficulty(d=>{const opts=['casual','normal','hard'];return opts[(opts.indexOf(d)+i.vertical+3)%3];});
   if(i.coop)setCoop(c=>!c);
   if(i.help)setHelp(true);else if(i.confirm)start();
  }else if(state==='upgrade'){
   const choices=runtime.current.world.upgrades;
   if(i.horizontal||i.vertical)setUpgradeCursor(n=>(n+(i.horizontal||i.vertical)+choices.length)%choices.length);
   if(i.confirm)upgrade(choices[upgradeCursor]?.id);
   }else if(state==='paused'){
   if(i.vertical||i.horizontal)setPauseCursor(n=>(n+(i.vertical||i.horizontal)+5)%5);
   if(i.back)pause();
   else if(i.confirm)[pause,()=>{setSettingsCursor(0);setSettings(true);},()=>setHelp(true),fullscreen,home][pauseCursor]();
   if(i.help)setHelp(true);
  }
  else if(state==='victory'||state==='defeat'){if(i.confirm)start();else if(i.back)home();}
  if(i.confirm&&runtime.current?.world?.status==='playing')for(const p of runtime.current.world.players)p.lastDash=true;
 }
 function pause(){if(settings||help)return;const rt=runtime.current,g=rt?.world;if(!g)return;if(g.status==='playing'){g.status='paused';setPauseCursor(0);}else if(g.status==='paused')g.status='playing';else return;rt.controls.clear();sync(g);}
 function start(){
  const rt=runtime.current;if(!rt)return;const pads=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).filter(Boolean):[];
  if(coop&&!pads.length){setNotice('Connect a controller and press any controller button to add Player 2.');return;}
  rt.audio.unlock().catch(()=>setNotice('Audio is unavailable. You can still play.'));
  rt.world=new World({hero,difficulty,coop});rt.controls.clear();rt.accumulator=0;rt.hitPause=0;rt.audio.step=0;rt.audio.next=rt.audio.ctx?rt.audio.ctx.currentTime+.04:0;
  setNotice('');setUpgradeCursor(0);setSettings(false);setHelp(false);sync(rt.world);
 }
 function home(){const rt=runtime.current;if(rt){rt.world=null;rt.controls.clear();rt.audio.setState(false);}setView('menu');setHud(null);setSettings(false);}
 function upgrade(id){const g=runtime.current?.world;if(g?.chooseUpgrade(id)){runtime.current.controls.clear();sync(g);}}
 function setting(key,value){setPrefs(p=>({...p,[key]:value}));}
 function fullscreen(){const p=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();p?.catch(()=>setNotice('Fullscreen is unavailable in this browser.'));}
 actions.current={pause,start,home,upgrade,menuInput};
 useEffect(()=>{prefsRef.current=prefs;if(!prefsReady.current)return;try{localStorage.setItem('cape-crisis-prefs',JSON.stringify(prefs));}catch{}},[prefs]);
 useEffect(()=>{
  try{const saved=JSON.parse(localStorage.getItem('cape-crisis-prefs')||'null');if(saved&&typeof saved==='object')setPrefs({...defaults,...Object.fromEntries(Object.entries(saved).filter(([k,v])=>k in defaults&&typeof v==='boolean'))});const n=Number(localStorage.getItem('cape-crisis-best'));if(Number.isFinite(n))setBest(n);}catch{}
  prefsReady.current=true;
  if(!localStorageSafeMotion())setPrefs(p=>({...p,shake:false}));
  const renderer=new Renderer(canvas.current),audio=new AudioDirector(),controls=new Controls(canvas.current,renderer,()=>actions.current.pause());
  const rt={renderer,audio,controls,menuPad:new MenuPad(),world:null,accumulator:0,hitPause:0};runtime.current=rt;
  let raf=0,last=performance.now(),lastHud=0,alive=true;
  function frame(now){
   if(!alive)return;const dt=Math.min(.12,(now-last)/1000);last=now;const pads=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).filter(Boolean):[];actions.current.menuInput(rt.menuPad.sample(pads[0],now));const g=rt.world;audio.music=prefsRef.current.music;audio.effects=prefsRef.current.effects;
   if(g){
    audio.setState(g.status==='playing',g.chapter);
    if(g.status==='playing'){const frozen=rt.hitPause>0;rt.hitPause=Math.max(0,rt.hitPause-dt);rt.accumulator+=frozen?0:dt;let steps=0;while(rt.accumulator>=1/60&&steps++<8&&g.status==='playing'){g.step(1/60,controls.read(g,prefsRef.current.autoAim));rt.accumulator-=1/60;}}else {rt.accumulator=0;if(g.status==='paused')controls.read(g,prefsRef.current.autoAim);}
    for(const e of g.drainEvents()){
     audio.event(e);if(e.type==='chapter')setUpgradeCursor(0);
     if(prefsRef.current.shake&&(e.type==='super'||e.type==='hurt'||e.type==='hit'&&e.heavy))rt.hitPause=Math.max(rt.hitPause,e.type==='super'?.055:.025);
    }
    if((g.status==='victory'||g.status==='defeat')&&!g.resultSaved){g.resultSaved=true;setBest(previous=>{const b=Math.max(previous,g.score);try{localStorage.setItem('cape-crisis-best',String(b));}catch{}return b;});controls.clear();}
    if(now-lastHud>100){lastHud=now;setHud(snapshot(g));setView(g.status);setTouchMode(controls.usingTouch);}
    renderer.render(g,{shake:prefsRef.current.shake,touch:controls.usingTouch?controls.touch:null,aim:controls.mouse.seen&&controls.mode!=='gamepad'&&!controls.usingTouch&&!prefsRef.current.autoAim?controls.mouse:null});
   }else audio.setState(false);
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const hidden=()=>{if(rt.world?.status==='playing'){rt.world.status='paused';controls.clear();sync(rt.world);audio.setState(false);}};
  const lost=()=>{if(rt.world?.players.length===2&&rt.world.status==='playing'){rt.world.status='paused';controls.clear();sync(rt.world);setNotice('Player 2 disconnected. Reconnect the controller, then resume.');}};
  const poll=()=>{if(typeof navigator.getGamepads==='function')setPadCount(Array.from(navigator.getGamepads()).filter(Boolean).length);};
  const interval=setInterval(poll,900);poll();document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',hidden);window.addEventListener('gamepaddisconnected',lost);
  const mc=document.modelContext,abort=new AbortController();
  if(mc?.registerTool){
   const tools=[
    {name:'read_game_status',title:'Read game status',description:'Read the current CAPE CRISIS run, hero health, score and chapter.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).length)throw Error('Expected an empty object.');return rt.world?.summary()||{status:'menu'};}},
    {name:'set_game_paused',title:'Pause or resume the game',description:'Pause or resume an active run without changing the hero or score.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(typeof input?.paused!=='boolean'||Object.keys(input).some(k=>k!=='paused'))throw Error('paused must be a boolean.');const g=rt.world;if(!g||!['playing','paused'].includes(g.status))throw Error('No active run to pause or resume.');if((g.status==='paused')!==input.paused)actions.current.pause();return g.summary();}}
   ];for(const tool of tools){try{Promise.resolve(mc.registerTool(tool,{signal:abort.signal})).catch(()=>{});}catch{}}
  }
  return()=>{alive=false;cancelAnimationFrame(raf);clearInterval(interval);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',hidden);window.removeEventListener('gamepaddisconnected',lost);abort.abort();controls.dispose();audio.dispose();runtime.current=null;};
 },[]);
 const playing=view!=='menu',ended=view==='victory'||view==='defeat',chapter=CHAPTERS[Math.max(0,(hud?.chapter||1)-1)];
 const touchButton=(kind,down,e)=>{e.preventDefault();e.stopPropagation();if(down)e.currentTarget.setPointerCapture(e.pointerId);const c=runtime.current?.controls;if(c)c[kind]=down;};
 return <main className={playing?'cabinet in-game':'cabinet'}>
  <canvas ref={canvas} className={playing?'battlefield visible':'battlefield'} aria-label="Alien battlefield. WASD moves; hold mouse to shoot; Space dashes; E unleashes super."/>
  {!playing&&<div className="title-screen">
   <img className="cover-art" src="cape-crisis-splash.png" alt="Three caped superheroes face an alien invasion beneath a huge mothership in Nova City."/><div className="cover-shade"/>
   <header className="masthead"><div className="imprint"><span className="imprint-star">✳</span><span>AFTER HOURS<br/><b>ARCADE</b></span></div><div className="edition"><span className="live-dot"/> A VERY BAD NIGHT IN NOVA CITY</div><Button variant="ghost" className="icon-button" onClick={()=>setSettings(true)} aria-label="Open settings"><Settings2/></Button></header>
   <section className="title-copy"><span className="issue-tag">ISSUE NO. 01 <span>THE INVASION</span></span><h1>CAPE<span className="title-slashes">//</span><br/><em>CRISIS</em><span className="title-period">!</span></h1><p className="title-sub">GREAT POWERS.<br/>TERRIBLE SPACE NEIGHBORS.</p><p className="title-description">The aliens picked the wrong planet.<br/>Pick a hero. Hold the line. Make a mess.</p></section>
   <span className="cover-stamp">NO SAVING THE WORLD<br/>BEFORE COFFEE.</span>
   <div className="launch-deck">
    <div className="selection-heading"><span><b>01</b> CHOOSE YOUR HERO</span><span className="best-score"><Trophy size={14}/> PERSONAL BEST <strong>{num(best)}</strong></span></div>
    <RadioGroup value={hero} onValueChange={setHero} className="hero-grid" aria-label="Choose your hero">{HEROES.map(h=>{const Icon=icons[h.id];return <label key={h.id} className={'hero-card '+(hero===h.id?'selected':'')} style={{'--hero':h.color}}><RadioGroupItem value={h.id} className="hero-radio"/><Icon className="hero-emblem" strokeWidth={1.5}/><div><span className="hero-role">{h.role}</span><strong>{h.name}</strong><p>{h.desc}</p><span className="dash-description">DASH / {DASHES[h.id].name}</span></div><span className="hero-check">{hero===h.id?<Check size={16}/>:<ArrowRight size={16}/>}</span></label>;})}</RadioGroup>
    <div className="launch-row"><div className="run-setup">
     <RadioGroup value={difficulty} onValueChange={setDifficulty} className="difficulty-row" aria-label="Difficulty">{[['casual','CHILL'],['normal','ARCADE'],['hard','CHAOS']].map(([value,label])=><label key={value} className={difficulty===value?'difficulty active':'difficulty'}><RadioGroupItem value={value}/>{label}</label>)}</RadioGroup>
     <label className="coop-toggle"><Gamepad2 size={17}/><Switch checked={coop} onCheckedChange={setCoop} aria-label="Two player local co-op"/><span>LOCAL CO-OP <small>{padCount?'Controller ready':'P2 needs a controller'}</small></span></label>
    </div><Button className="launch-button" onClick={start}><span>LET’S SAVE THE CITY</span><ArrowRight size={24}/></Button></div>
    <footer className="menu-footer"><Button variant="ghost" onClick={()=>setHelp(true)} className="text-button"><Crosshair size={15}/> HOW TO PLAY</Button><span><AudioLines size={15}/> SIX CHAPTERS. TURN IT UP.</span><span className="credit">{padCount?'PAD / ← → HERO · ↑ ↓ DIFFICULTY · A PLAY':'ISSUE 02 / SUPERCHARGED'}</span></footer>
   </div>
  </div>}
  {playing&&hud&&<>
   <header className="game-hud"><div className="health-panels">{hud.players.map(p=><div className="health-panel" key={p.id} style={{'--hero':p.def.color}}><span className="hud-hero">{p.id?'P2 / ':''}{p.def.name}<small>{p.hp<=0?'DOWN':Math.ceil(p.hp)+' / '+p.maxHp}</small></span><div className="health-track"><i style={{width:Math.max(0,p.hp/p.maxHp)*100+'%'}}/></div></div>)}</div>
    <div className="score-panel"><span>SCORE</span><strong>{num(hud.score).padStart(6,'0')}</strong>{hud.combo>0&&<div className="combo-readout"><em>×{1+Math.min(9,Math.floor(hud.combo/12))} / {hud.combo} CHAIN</em><span><i style={{width:Math.min(100,hud.comboTimer/3*100)+'%'}}/></span></div>}</div><div className="run-time"><span>ISSUE {String(hud.chapter).padStart(2,'0')}</span><strong>{clock(hud.time)}</strong></div><Button variant="ghost" className="icon-button pause-button" onClick={pause} aria-label={view==='paused'?'Resume game':'Pause game'}>{view==='paused'?<Play/>:<Pause/>}</Button>
   </header>
   <div className="chapter-timeline" aria-label={'Chapter '+hud.chapter+' of 6'}>{CHAPTERS.map((c,n)=><span key={c.name} className={n+1<hud.chapter?'complete':n+1===hud.chapter?'current':''} style={{'--chapter':c.color}} title={c.name}><i style={{width:(n+1<hud.chapter?100:n+1===hud.chapter?(n===5?100:Math.min(100,(hud.elapsed%60)/60*100)):0)+'%'}}/><b>{String(n+1).padStart(2,'0')}</b></span>)}<small>{hud.chapter===6?'DESTROY THE MOTHERSHIP':Math.max(0,60-Math.floor(hud.elapsed%60))+'s TO NEXT ISSUE'}</small></div>
   {view==='playing'&&hud.time<24&&<div className="field-guide"><Crosshair size={16}/><span>{hud.progress.move<.5?(touchMode?'DRAG LEFT HALF TO MOVE':padCount?'LEFT STICK TO MOVE':'W A S D TO MOVE'):hud.progress.shoot<6?(touchMode?'DRAG RIGHT HALF TO FIRE':padCount?'RIGHT STICK TO FIRE':'HOLD CLICK TO FIRE · ARROW KEYS ALSO WORK'):hud.progress.dash<1?(touchMode?'TAP DASH TO HIT ALIENS':padCount?'A / LB: DASH THROUGH ALIENS':'SPACE: DASH THROUGH ALIENS'):hud.players[0].charge>=100?(touchMode?'SUPER IS READY — TAP SUPER':padCount?'X / RB: UNLEASH YOUR SUPER':'E: UNLEASH YOUR SUPER'):'KEEP MOVING. CHAIN KILLS. GRAB POWER-UPS.'}</span></div>}
   {hud.boss&&<div className="boss-hud"><span>{hud.boss.type==='mother'?'THE MOTHERSHIP':'THE COLLECTION AGENT'}{hud.boss.enraged?' / ENRAGED':''}</span><div><i style={{width:Math.max(0,hud.boss.hp/hud.boss.maxHp)*100+'%'}}/></div></div>}
   <div className="combat-footer"><div className="power-panels">{hud.players.map(p=><div className="power-panel" key={p.id} style={{'--hero':p.def.color}}>
    <div className={'super-meter '+(p.charge>=100?'ready':'')}><span><Zap size={15}/>{p.id?'P2 ':''}{p.charge>=100?'SUPER READY':p.def.super}</span><strong>{Math.floor(p.charge)}%</strong><i style={{width:p.charge+'%'}}/></div>
    <div className="weapon-line">{p.weapon?<><span style={{color:WEAPONS[p.weapon].color}}>{WEAPONS[p.weapon].name}</span><b>{Math.ceil(p.weaponTime)}s</b></>:<span>{p.hero==='solar'?'PHOTON BOLTS':p.hero==='volt'?'ARC LIGHTNING':'GRAVITY PUNCH'}</span>}<small>{p.dashCooldown>0?'DASH '+p.dashCooldown.toFixed(1)+'s':'DASH READY'}</small></div>{p.weapon&&<div className="weapon-duration"><i style={{width:p.weaponTime/WEAPONS[p.weapon].duration*100+'%',background:WEAPONS[p.weapon].color}}/></div>}
   </div>)}</div><div className="track-info"><AudioLines/><div><span>NOW PLAYING / {chapter.bpm} BPM</span><strong>{chapter.name}</strong></div></div><div className="game-control-hints"><span><kbd>SPACE</kbd> DASH</span><span><kbd>E</kbd> SUPER</span><span><kbd>ESC</kbd> PAUSE</span></div></div>
   {touchMode&&view==='playing'&&<div className="touch-actions">{[['buttonDash','DASH',Wind],['buttonSuper','SUPER',Zap]].map(([kind,label,Icon])=><button key={kind} className={kind==='buttonSuper'&&hud.players[0].charge>=100?'charged':''} aria-label={label} onPointerDown={e=>touchButton(kind,true,e)} onPointerUp={e=>touchButton(kind,false,e)} onPointerCancel={e=>touchButton(kind,false,e)} onLostPointerCapture={e=>touchButton(kind,false,e)}><Icon/>{label}</button>)}</div>}
  </>}
  <Dialog open={view==='upgrade'} onOpenChange={()=>{}}><DialogContent className="game-dialog upgrade-dialog" showCloseButton={false}><span className="dialog-kicker">NEXT ISSUE / POWER UP</span><DialogTitle className="dialog-heading">THICKER PLOT.<br/><em>BIGGER POWERS.</em></DialogTitle><DialogDescription className="dialog-copy">Choose one permanent upgrade.{coop?' Both heroes get it.':' It lasts for the rest of this run.'}</DialogDescription><div className="upgrade-grid">{hud?.upgrades.map((u,index)=>{const Icon=icons[u.icon];return <Button key={u.id} variant="outline" className={'upgrade-card '+(index===upgradeCursor?'pad-selected':'')} onMouseEnter={()=>setUpgradeCursor(index)} onFocus={()=>setUpgradeCursor(index)} onClick={()=>upgrade(u.id)}><Icon/><strong>{u.name}</strong><p>{u.desc}</p><span>{padCount&&index===upgradeCursor?'A / TAKE IT':'TAKE IT'} <ArrowRight size={16}/></span></Button>;})}</div></DialogContent></Dialog>
  <Dialog open={view==='paused'&&!settings&&!help} onOpenChange={open=>{if(!open&&!runtime.current?.controls.keys.has('Escape'))pause();}}><DialogContent className="game-dialog pause-dialog" showCloseButton={false}><span className="dialog-kicker">EVEN HEROES NEED A MINUTE.</span><DialogTitle className="dialog-heading">HOLD THAT<br/><em>THOUGHT.</em></DialogTitle><DialogDescription className="dialog-copy">The invasion can wait.</DialogDescription><Button className={'launch-button '+(padCount&&pauseCursor===0?'pad-focus':'')} onClick={pause}><Play/> BACK TO THE FIGHT <ArrowRight/></Button><div className="pause-options"><Button variant="outline" className={padCount&&pauseCursor===1?'pad-focus':''} onClick={()=>setSettings(true)}><Settings2/> Settings</Button><Button variant="outline" className={padCount&&pauseCursor===2?'pad-focus':''} onClick={()=>setHelp(true)}><Crosshair/> Controls</Button><Button variant="outline" className={padCount&&pauseCursor===3?'pad-focus':''} onClick={fullscreen}><Expand/> Fullscreen</Button></div><Button variant="ghost" className={'quit-button '+(padCount&&pauseCursor===4?'pad-focus':'')} onClick={home}>END RUN & RETURN TO TITLE</Button></DialogContent></Dialog>
  <Dialog open={ended} onOpenChange={()=>{}}><DialogContent className="game-dialog results-dialog" showCloseButton={false}><span className="dialog-kicker">{view==='victory'?'NOVA CITY OWES YOU ONE.':'HEROISM IS A WORK IN PROGRESS.'}</span><DialogTitle className="dialog-heading">{view==='victory'?<>PLANET<br/><em>SAVED.</em></>:<>TO BE<br/><em>CONTINUED…</em></>}</DialogTitle><DialogDescription className="dialog-copy">{view==='victory'?'The mothership is scrap. The coffee is still warm.':'One more run. This time, make them pay for parking.'}</DialogDescription><div className="result-score"><span>FINAL SCORE</span><strong>{num(hud?.score)}</strong>{hud?.score>=best&&hud?.score>0&&<em><Trophy size={16}/> PERSONAL BEST</em>}</div>{hud?.acquired.length>0&&<div className="build-recap"><span>YOUR LOADOUT</span><div>{hud.acquired.map((id,n)=><b key={n}>{UPGRADES.find(u=>u.id===id)?.name}</b>)}</div></div>}<div className="result-stats"><div><strong>{clock(hud?.time||0)}</strong><span>SURVIVED</span></div><div><strong>{num(hud?.kills)}</strong><span>ALIENS EVICTED</span></div><div><strong>{hud?.bestCombo||0}</strong><span>BEST CHAIN</span></div></div><Button className="launch-button" onClick={start}>ONE MORE ISSUE <ArrowRight/></Button><Button variant="ghost" className="quit-button" onClick={home}>CHANGE HERO / TITLE SCREEN</Button></DialogContent></Dialog>
  <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="game-dialog settings-dialog"><span className="dialog-kicker">TUNE YOUR FREQUENCY</span><DialogTitle className="dialog-heading">THE<br/><em>CONTROLS.</em></DialogTitle><DialogDescription className="dialog-copy">Saved on this device. Sound starts when you play.</DialogDescription>{[['music','The soundtrack','Original reactive synth-rock. Headphones encouraged.',Music2],['effects','Combat sounds','Every zap, dash, crunch, and glorious explosion.',Volume2],['shake','Screen shake','A little extra impact. Switch off for a calmer screen.',Sparkles],['autoAim','Auto aim & fire','Focus on movement. Your hero targets the nearest alien.',Crosshair]].map(([key,title,desc,Icon],index)=><label className={'setting-row '+(padCount&&settingsCursor===index?'pad-focus':'')} key={key}><Icon size={22}/><span><strong>{title}</strong><small>{desc}</small></span><Switch checked={prefs[key]} onCheckedChange={v=>setting(key,v)} aria-label={title}/></label>)}<Button variant="outline" className={'wide-button '+(padCount&&settingsCursor===4?'pad-focus':'')} onClick={fullscreen}><Expand/> TOGGLE FULLSCREEN</Button></DialogContent></Dialog>
  <Dialog open={help} onOpenChange={setHelp}><DialogContent className="game-dialog help-dialog"><span className="dialog-kicker">THE VERY SHORT TRAINING MONTAGE</span><DialogTitle className="dialog-heading">LOOK ALIVE,<br/><em>HERO.</em></DialogTitle><DialogDescription className="dialog-copy">Survive five escalating minutes, then destroy the mothership. Keep kills close together to build a score multiplier.</DialogDescription><div className="controls-list">{[['MOVE','W A S D'],['AIM & FIRE','Mouse + hold click / Arrow keys'],['SIGNATURE DASH ATTACK','Space / Shift'],['UNLEASH SUPER','E / Q · needs 100% charge'],['PAUSE','Esc / P']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div><p className="help-note"><Gamepad2/> Controller: left stick moves, right stick fires, A / LB attacks with a dash, X / RB unleashes super, Menu pauses. In menus: left/right selects; A confirms; B backs out.</p><p className="help-note"><Crosshair/> Touch: drag the left half to move and the right half to aim and fire. Use DASH and SUPER. Landscape gives you more room.</p><p className="help-note"><Heart/> Co-op: Player 1 uses keyboard and mouse; Player 2 uses the first controller. Stand near a downed teammate for 2.5 seconds to revive them.</p><p className="help-note"><Shield/> Grab pickups for health, shields, super energy, or a 16-second weapon. Boss warnings lock before firing. Leave purple lanes; dash through expanding gold rings. Every hero’s dash also damages aliens.</p></DialogContent></Dialog>
  {notice&&<div className="notice" role="status"><span>{notice}</span><Button variant="ghost" size="icon" onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={16}/></Button></div>}
 </main>;
}
