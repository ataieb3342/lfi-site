import {createWorld,getEntity} from './world.js';
import {tickWorld,orderMove,orderGather,orderAttack,orderInteract,startConstruction,orderBuild,queueUnit,population} from './game.js';
import {beginAge,beginResearch,usePower,currentAge,statValue} from './progression.js';
import {screenToWorld,worldToScreen} from './camera.js';
import {toggleSelection,selectSimilarVisible,selectRectangle,storeControlGroup,recallControlGroup} from './selection.js';
import {fogAt,isEntityVisible} from './fog.js';
import {minimapToWorld,pointInMinimap} from './minimap.js';
import {draw} from './render.js';
import {MAP,TYPES,LABELS,AGES,TECHNOLOGIES,POWERS,AI_DIFFICULTIES} from './data.js';

const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),stage=document.querySelector('.stage');
let w=createWorld();
let started=false;
const c={x:540,y:500,zoom:.75,width:800,height:500};
const ui={selected:[],build:null,mouse:{x:0,y:0},drag:null,minimapDrag:false,formation:'compact'};
const keys=new Set(),groups={};
let previous=performance.now(),toastUntil=0;
function resize(){const r=stage.getBoundingClientRect();c.width=r.width;c.height=r.height;const ratio=devicePixelRatio||1;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
window.addEventListener('resize',resize);resize();
function message(s){if(!s)return;const el=document.querySelector('#toast');el.textContent=s;el.classList.add('show');toastUntil=performance.now()+2700;}
const pointer=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
function findAt(p){
 const q=screenToWorld(c,p.x,p.y);
 return [...w.units].reverse().find(u=>isEntityVisible(w,u)&&Math.hypot(u.x-q.x,u.y-q.y)<18)||
  [...w.buildings].reverse().find(b=>isEntityVisible(w,b)&&Math.hypot(b.x-q.x,b.y-q.y)<TYPES[b.kind].radius)||
  w.nodes.find(n=>n.amount>0&&fogAt(w,n.x,n.y)>0&&Math.hypot(n.x-q.x,n.y-q.y)<27);
}
function panMinimap(p){const target=minimapToWorld(c,p.x,p.y);if(!target)return false;c.x=target.x;c.y=target.y;return true;}
canvas.addEventListener('mousedown',e=>{
 if(e.button!==0||w.outcome!=='playing')return;
 const p=pointer(e);
 if(panMinimap(p)){ui.minimapDrag=true;ui.drag=null;return;}
 ui.drag={x:p.x,y:p.y,toX:p.x,toY:p.y};
});
canvas.addEventListener('mousemove',e=>{
 const p=pointer(e);ui.mouse=screenToWorld(c,p.x,p.y);
 if(ui.minimapDrag&&e.buttons&1){panMinimap(p);return;}
 if(ui.drag){ui.drag.toX=p.x;ui.drag.toY=p.y;}
});
window.addEventListener('mouseup',e=>{
 if(ui.minimapDrag){ui.minimapDrag=false;return;}
 if(e.button!==0||!ui.drag)return;
 const d=ui.drag;ui.drag=null;
 const p=pointer(e),q=screenToWorld(c,p.x,p.y);
 if(ui.build){
  if(fogAt(w,q.x,q.y)!==2){message('Explore d’abord cette zone');return;}
  const workers=ui.selected.filter(id=>w.units.some(u=>u.id===id&&u.kind==='worker'));
  const result=startConstruction(w,workers,ui.build,q.x,q.y);
  message(result.ok?LABELS[ui.build]+' : chantier lancé':result.reason);
  if(result.ok)ui.build=null;
  refresh();return;
 }
 if(Math.hypot(d.x-p.x,d.y-p.y)>8)ui.selected=selectRectangle(w,c,{...d,toX:p.x,toY:p.y});
 else{
  const target=findAt(p);
  if(target?.team==='player')ui.selected=e.shiftKey?toggleSelection(ui.selected,target.id):[target.id];
  else if(!e.shiftKey)ui.selected=[];
 }
 refresh();
});
canvas.addEventListener('dblclick',e=>{
 const p=pointer(e);if(pointInMinimap(c,p.x,p.y))return;
 const target=findAt(p);
 if(target?.type!=='unit'||target.team!=='player')return;
 const similar=selectSimilarVisible(w,c,target.kind);
 ui.selected=e.shiftKey?[...new Set([...ui.selected,...similar])]:similar;
 refresh();
});
canvas.addEventListener('contextmenu',e=>{
 e.preventDefault();if(w.outcome!=='playing')return;
 ui.build=null;
 const p=pointer(e),target=findAt(p),q=screenToWorld(c,p.x,p.y);
 if(pointInMinimap(c,p.x,p.y))return;
 let result;
 if(target?.type==='node')result=orderGather(w,ui.selected,target.id);
 else if(target?.team==='enemy')result=orderAttack(w,ui.selected,target.id);
 else if(target?.team==='player'&&target.type==='building'&&!target.complete)result=orderBuild(w,ui.selected,target.id);
 else if(target?.team==='player'&&target.type==='building')result=orderInteract(w,ui.selected,target.id,ui.formation);
 else result=orderMove(w,ui.selected,q.x,q.y,ui.formation);
 if(!result.ok)message(result.reason);
 refresh();
});
canvas.addEventListener('wheel',e=>{
 e.preventDefault();const p=pointer(e),before=screenToWorld(c,p.x,p.y);
 c.zoom=Math.max(.45,Math.min(1.7,c.zoom*(e.deltaY>0?.9:1.1)));
 const after=screenToWorld(c,p.x,p.y);c.x+=before.x-after.x;c.y+=before.y-after.y;
},{passive:false});
window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
 if(/^[1-9]$/.test(e.key)){
  e.preventDefault();if(e.repeat)return;
  if(e.ctrlKey){storeControlGroup(groups,Number(e.key),ui.selected,w);message('Groupe '+e.key+' enregistré');}
  else{ui.selected=recallControlGroup(groups,Number(e.key),w);refresh();}
  return;
 }
 if(!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='f'){ui.formation='compact';refresh();}
 if(!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='l'){ui.formation='line';refresh();}
 keys.add(e.key.toLowerCase());
 if(e.key==='Escape'){ui.build=null;refresh();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.querySelector('#help').onclick=()=>document.querySelector('#help-panel').hidden=false;
document.querySelector('#close-help').onclick=()=>document.querySelector('#help-panel').hidden=true;
document.querySelector('#restart').onclick=()=>{document.querySelector('#banner').hidden=true;document.querySelector('#start-menu').hidden=false;started=false;};
document.querySelectorAll('[data-difficulty]').forEach(el=>el.onclick=()=>{
 const difficulty=el.dataset.difficulty;
 w=createWorld(difficulty);started=true;ui.selected=[];ui.build=null;ui.formation='compact';
 for(const key of Object.keys(groups))delete groups[key];
 c.x=540;c.y=500;c.zoom=.75;previous=performance.now();
 document.querySelector('#start-menu').hidden=true;document.querySelector('#banner').hidden=true;refresh();
});
function button(title,cost,action,execute=null){
 const el=document.createElement('button');el.className='action'+(ui.build===action?' active':'');
 el.innerHTML=title+(cost?'<small>'+Object.entries(cost).map(([k,v])=>v+' '+LABELS[k]).join(' · ')+'</small>':'');
 el.onclick=()=>{
  if(execute){const result=execute();message(result.ok?'Commande lancée':result.reason);}
  else if(['house','barracks','workshop'].includes(action)){ui.build=action;message('Choisis un emplacement sur la carte');}
  else{const result=queueUnit(w,ui.selected[0],action);message(result.ok?'Unité en formation':result.reason);}
  refresh();
 };return el;
}
function formationButton(kind,label){
 const el=document.createElement('button');el.className='action'+(ui.formation===kind?' active':'');
 el.textContent=label;el.onclick=()=>{ui.formation=kind;refresh();};return el;
}
function refresh(){
 const stock=w.stock.player,pop=population(w,'player'),age=currentAge(w,'player');
 document.querySelector('#difficulty-status').textContent=`IA : ${AI_DIFFICULTIES[w.difficulty].label}`;
 document.querySelector('#resources').innerHTML=`<div class="resource"><span>Époque</span><b>⌛ ${AGES[age].label}</b></div><div class="resource"><span>🌾 Nourriture</span><b>🌾 ${Math.floor(stock.food)}</b></div><div class="resource"><span>🌲 Bois</span><b>🌲 ${Math.floor(stock.wood)}</b></div><div class="resource"><span>✦ Or</span><b>✦ ${Math.floor(stock.gold)}</b></div><div class="resource"><span>Pierre</span><b>🪨 ${Math.floor(stock.stone)}</b></div><div class="resource"><span>Population</span><b>♟ ${pop.used}/${pop.max}</b></div>`;
 const selected=ui.selected.map(id=>getEntity(w,id)).filter(Boolean),info=document.querySelector('#selection'),actions=document.querySelector('#actions');
 actions.replaceChildren();
 if(!selected.length){info.textContent='Sélectionne tes ouvriers pour commencer.';return;}
 const e=selected[0];
 const research=e.research,task=research&&(research.type==='age'?AGES[research.key]:TECHNOLOGIES[research.key]);
 info.innerHTML=selected.length>1?`<b>${selected.length} unités</b><br>Formation : ${ui.formation==='line'?'en ligne':'compacte'}`:`<b>${LABELS[e.kind]}</b> · ${e.team==='player'?'Aube':'Crépuscule'}<br>Vie : ${Math.max(0,Math.ceil(e.hp))} / ${e.maxHp} <span class="hp"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></span>${e.type==='unit'?`<br>Attaque : ${Math.round(statValue(w,e.team,e.kind,'damage'))} · Armure : ${Math.round(statValue(w,e.team,e.kind,'armor'))} · Portée : ${TYPES[e.kind].attackRange} · Cadence : ${TYPES[e.kind].attackSpeed}s · Vitesse : ${Math.round(statValue(w,e.team,e.kind,'movementSpeed'))} · Population : ${TYPES[e.kind].populationCost}`:''}${e.queue?.length?`<br>En formation : ${e.queue.map(k=>LABELS[k]).join(', ')}`:''}${task?`<br>${task.label} : ${Math.min(100,Math.floor(research.progress/task.time*100))} %`:''}`;
 if(selected.some(x=>x.kind==='worker')){
  actions.append(button('⌂ Maison',TYPES.house.cost,'house'),button('⚒ Caserne',TYPES.barracks.cost,'barracks'));
  if(age>=2)actions.append(button('⚙ Atelier',TYPES.workshop.cost,'workshop'));
 }
 if(selected.length===1&&e.kind==='town'&&e.team==='player'){
  actions.append(button('♟ Former un ouvrier',TYPES.worker.cost,'worker'));
  if(age<3)actions.append(button(`⌛ Passer à l’${AGES[age+1].label}`,AGES[age+1].cost,'age',()=>beginAge(w,e.id)));
  if(age>=3)for(const [key,power] of Object.entries(POWERS))actions.append(button(`✧ ${power.label}`,power.cost,key,()=>usePower(w,e.id,key)));
 }
 if(selected.length===1&&e.kind==='barracks'&&e.complete){
  for(const [kind,title] of [['soldier','⚔ Fantassin'],['spearman','♠ Lancier'],['archer','🏹 Archer'],['cavalry','♞ Cavalier'],['champion','⚜ Champion']])
   if(age>=(kind==='archer'||kind==='cavalry'?2:kind==='champion'?3:1))actions.append(button(title,TYPES[kind].cost,kind));
 }
 if(selected.length===1&&e.kind==='workshop'&&e.complete){
  if(age>=3)actions.append(button('✦ Gardien mythique',TYPES.mythic.cost,'mythic'));
  for(const [key,tech] of Object.entries(TECHNOLOGIES))
   if(age>=tech.age&&!w.progression.player.techs.includes(key)&&(!tech.requires||w.progression.player.techs.includes(tech.requires)))
    actions.append(button(`⚙ ${tech.label}`,tech.cost,key,()=>beginResearch(w,e.id,key)));
 }
 if(selected.filter(x=>x.type==='unit').length>1)actions.append(formationButton('compact','◆ Compacte'),formationButton('line','▬ En ligne'));
}
function loop(now){
 const dt=Math.min((now-previous)/1000,.05);previous=now;
 if(started&&w.outcome==='playing'){
  const px=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('q')||keys.has('a')||keys.has('arrowleft')?1:0);
  const py=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('z')||keys.has('w')||keys.has('arrowup')?1:0);
  c.x=Math.max(0,Math.min(MAP.width,c.x+px*440*dt/c.zoom));c.y=Math.max(0,Math.min(MAP.height,c.y+py*440*dt/c.zoom));
  tickWorld(w,dt);
  if(w.outcome!=='playing'){
   document.querySelector('#result').textContent=w.outcome==='won'?'Victoire de l’Aube':'Le Crépuscule l’emporte';
   document.querySelector('#result-text').textContent=w.outcome==='won'?'Le sanctuaire adverse est tombé.':'Ton sanctuaire a été détruit.';
   document.querySelector('#banner').hidden=false;
  }
 }
 if(now>toastUntil)document.querySelector('#toast').classList.remove('show');
 if(!loop.lastRefresh||now-loop.lastRefresh>350){ui.selected=ui.selected.filter(id=>getEntity(w,id));refresh();loop.lastRefresh=now;}
 draw(ctx,w,c,ui);requestAnimationFrame(loop);
}
refresh();requestAnimationFrame(loop);
