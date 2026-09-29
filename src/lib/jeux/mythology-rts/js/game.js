import {MAP,TYPES,AI,AI_DIFFICULTIES,COMBAT,AGES} from './data.js';
import {getEntity,makeUnit,makeBuilding,findPath,isWalkable,canBuild,unitRadius,unitSpotFree} from './world.js';
import {terrainSpeed,terrainBlocked} from './terrain.js';
import {updateVision} from './fog.js';
import {beginAge,beginResearch,currentAge,unlocked,statValue,tickProgression,usePower} from './progression.js';
const ok=(reason='')=>({ok:!reason,reason});
const alive=(w,ids,team='player')=>ids.map(id=>w.units.find(u=>u.id===id&&u.team===team)).filter(Boolean);
const affordable=(w,team,cost)=>Object.entries(cost).every(([k,v])=>w.stock[team][k]>=v);
const pay=(w,team,cost)=>{for(const[k,v]of Object.entries(cost))w.stock[team][k]-=v;};
const aiSettings=w=>AI_DIFFICULTIES[w.difficulty]||AI_DIFFICULTIES.normal;
export function setDestination(w,u,x,y){const angle=Math.atan2(y-u.y,x-u.x);for(const radius of [0,45,75,115]){const tx=x-Math.cos(angle)*radius,ty=y-Math.sin(angle)*radius;const path=findPath(w,u,{x:tx,y:ty},u);if(path.length){u.path=path;return true;}}u.path=[];return false;}
function setApproach(w,u,building){
 const angle=Math.atan2(u.y-building.y,u.x-building.x),radius=TYPES[building.kind].radius+25;
 const offsets=[0,.4,-.4,.8,-.8,1.2,-1.2],first=u.id%offsets.length;
 for(let i=0;i<offsets.length;i++){
  const theta=angle+offsets[(first+i)%offsets.length],x=building.x+Math.cos(theta)*radius,y=building.y+Math.sin(theta)*radius;
  if(!unitSpotFree(w,u,x,y))continue;
  const path=findPath(w,u,{x,y},u);if(path.length){u.path=path;return true;}
 }
 return setDestination(w,u,building.x,building.y);
}
export function orderMove(w,ids,x,y,formation='compact'){
 if(x<0||x>MAP.width||y<0||y>MAP.height)return ok('Hors de la carte');
 const units=alive(w,ids);
 if(!units.length)return ok('Sélectionne une unité');
 const center={x:units.reduce((sum,u)=>sum+u.x,0)/units.length,y:units.reduce((sum,u)=>sum+u.y,0)/units.length};
 const angle=Math.atan2(y-center.y,x-center.x),fx=Math.cos(angle),fy=Math.sin(angle),sx=-fy,sy=fx;
 const spacing=Math.max(38,...units.map(u=>unitRadius(u)*2+10));
 units.sort((a,b)=>(a.x-center.x)*sx+(a.y-center.y)*sy-((b.x-center.x)*sx+(b.y-center.y)*sy));
 const columns=formation==='line'?units.length:Math.ceil(Math.sqrt(units.length)),rows=Math.ceil(units.length/columns),reserved=[];
 let assigned=0;
 for(const [i,u] of units.entries()){
  const lateral=(i%columns-(columns-1)/2)*spacing,depth=formation==='line'?0:(Math.floor(i/columns)-(rows-1)/2)*spacing;
  const slot={x:x+sx*lateral-fx*depth,y:y+sy*lateral-fy*depth};
  let route=null,target=null;
  for(const radius of [0,spacing,spacing*2,spacing*3,spacing*4]){
   for(let j=0;j<(radius?12:1);j++){
    const px=slot.x+radius*Math.cos(j*Math.PI/6),py=slot.y+radius*Math.sin(j*Math.PI/6);
    if(!isWalkable(w,px,py,unitRadius(u)+2)||reserved.some(p=>Math.hypot(p.x-px,p.y-py)<p.radius+unitRadius(u)+8))continue;
    if(w.units.some(other=>other!==u&&other.hp>0&&!units.includes(other)&&Math.hypot(other.x-px,other.y-py)<unitRadius(other)+unitRadius(u)+4))continue;
    const path=findPath(w,u,{x:px,y:py},u);
    if(path.length||Math.hypot(px-u.x,py-u.y)<4){route=path;target={x:px,y:py};break;}
   }
   if(target)break;
  }
  if(!target)continue;
  u.order={type:'move',x:target.x,y:target.y};u.path=route;reserved.push({...target,radius:unitRadius(u)});assigned++;
 }
 return assigned?ok():ok('Aucun passage accessible');
}
export function orderGather(w,ids,nodeId){const n=w.nodes.find(n=>n.id===nodeId&&n.amount>0);if(!n)return ok('Ressource épuisée');const units=alive(w,ids).filter(u=>u.kind==='worker');for(const u of units){u.order={type:'gather',target:n.id};setDestination(w,u,n.x,n.y);}return units.length?ok():ok('Sélectionne un ouvrier');}
export function population(w,team){const max=w.buildings.filter(b=>b.team===team&&b.complete&&b.hp>0).reduce((a,b)=>a+(TYPES[b.kind].pop||0),0);const used=w.units.filter(u=>u.team===team&&u.hp>0).reduce((n,u)=>n+(TYPES[u.kind].populationCost||1),0)+w.buildings.filter(b=>b.team===team).reduce((n,b)=>n+b.queue.reduce((sum,kind)=>sum+(TYPES[kind].populationCost||1),0),0);return {used,max};}
export function startConstruction(w,ids,kind,x,y,team='player'){if(!['house','barracks','workshop'].includes(kind))return ok('Bâtiment inconnu');if(!unlocked(w,team,kind))return ok('Âge supérieur requis');if(!canBuild(w,x,y,TYPES[kind].radius,team==='enemy'))return ok('Emplacement bloqué : éloigne les unités ou choisis un autre endroit');const units=alive(w,ids,team).filter(u=>u.kind==='worker');if(!units.length)return ok('Sélectionne un ouvrier');if(!affordable(w,team,TYPES[kind].cost))return ok('Ressources insuffisantes');pay(w,team,TYPES[kind].cost);const b=makeBuilding(w,kind,team,x,y,false);w.buildings.push(b);for(const u of units){u.order={type:'build',target:b.id};setApproach(w,u,b);}return {ok:true,building:b};}
export function orderBuild(w,ids,buildingId){const b=w.buildings.find(b=>b.id===buildingId&&b.team==='player'&&b.hp>0&&!b.complete);if(!b)return ok('Chantier indisponible');const workers=alive(w,ids).filter(u=>u.kind==='worker');if(!workers.length)return ok('Sélectionne un ouvrier');for(const u of workers){u.order={type:'build',target:b.id};setApproach(w,u,b);}return ok();}
export function orderInteract(w,ids,buildingId,formation='compact'){
 const b=w.buildings.find(b=>b.id===buildingId&&b.team==='player'&&b.hp>0&&b.complete);
 if(!b)return ok('Bâtiment indisponible');
 const units=alive(w,ids);
 if(!units.length)return ok('Sélectionne une unité');
 const carriers=units.filter(u=>u.kind==='worker'&&u.carry>0&&b.kind==='town');
 for(const u of carriers){u.order={type:'deliver',target:b.id};setApproach(w,u,b);}
 const others=units.filter(u=>!carriers.includes(u));
 if(others.length){
  const angle=Math.atan2(others[0].y-b.y,others[0].x-b.x);
  orderMove(w,others.map(u=>u.id),b.x+Math.cos(angle)*(TYPES[b.kind].radius+70),b.y+Math.sin(angle)*(TYPES[b.kind].radius+70),formation);
 }
 return ok();
}
export function queueUnit(w,buildingId,kind,team='player'){const b=w.buildings.find(b=>b.id===buildingId&&b.team===team&&b.complete&&b.hp>0);if(!b||!((b.kind==='town'&&kind==='worker')||(b.kind==='barracks'&&['soldier','spearman','archer','cavalry','champion'].includes(kind))||(b.kind==='workshop'&&kind==='mythic')))return ok('Bâtiment non disponible');if(!unlocked(w,team,kind))return ok('Âge supérieur requis');if(b.research)return ok('Bâtiment occupé par une recherche');if(population(w,team).used+TYPES[kind].populationCost>population(w,team).max)return ok('Construis une maison');if(!affordable(w,team,TYPES[kind].resourceCost))return ok('Ressources insuffisantes');pay(w,team,TYPES[kind].resourceCost);b.queue.push(kind);return ok();}
export function orderAttack(w,ids,targetId){const t=getEntity(w,targetId);if(!t||!('hp'in t)||t.hp<=0)return ok('Cible absente');const units=alive(w,ids).filter(u=>u.team!==t.team);for(const u of units){u.order={type:'attack',target:targetId};setDestination(w,u,t.x,t.y);}return units.length?ok():ok('Aucune unité valide');}
function stepMove(w,u,dt){
 if(!u.path.length)return;
 u.navTime=(u.navTime||0)+dt;
 if(u.navTime>=1.4){
  if(u.navX!==undefined&&Math.hypot(u.x-u.navX,u.y-u.navY)<12){
   const goal=u.order?.type==='gather'&&u.carry>=10?nearestTown(w,u):getEntity(w,u.order?.target);
   if(goal?.type==='building')setApproach(w,u,goal);
   else if(goal)setDestination(w,u,goal.x,goal.y);
   else if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
  }
  u.navTime=0;u.navX=u.x;u.navY=u.y;
 }
 if(!u.path.length)return;
 let p=u.path[0],d=Math.hypot(p.x-u.x,p.y-u.y);
 // A grid waypoint can be occupied by an idle ally. Once close enough,
 // continue toward the next waypoint instead of circling the occupied spot.
 if(u.path.length>1&&d<unitRadius(u)*2+5&&w.units.some(other=>other!==u&&other.hp>0&&Math.hypot(other.x-p.x,other.y-p.y)<unitRadius(u)+unitRadius(other))){
  u.path.shift();p=u.path[0];d=Math.hypot(p.x-u.x,p.y-u.y);
 }
 if(d<1){u.path.shift();return;}
 const stride=statValue(w,u.team,u.kind,'movementSpeed')*dt*terrainSpeed(u.x,u.y,MAP.width,MAP.height),length=Math.min(stride,d),angle=Math.atan2(p.y-u.y,p.x-u.x);
 for(const offset of [0,.5,-.5,1,-1,1.5,-1.5]){
  const x=u.x+Math.cos(angle+offset)*length,y=u.y+Math.sin(angle+offset)*length;
  if(!unitSpotFree(w,u,x,y))continue;
  u.x=x;u.y=y;
  if(offset===0&&d<=stride+1)u.path.shift();
  return;
 }
 // Another unit can be standing on a waypoint: approach from a free side.
 if(d<unitRadius(u)*2&&u.path.length>1)u.path.shift();
}
function separateUnits(w){
 for(let pass=0;pass<3;pass++)for(let i=0;i<w.units.length;i++)for(let j=i+1;j<w.units.length;j++){
  const a=w.units[i],b=w.units[j];if(a.hp<=0||b.hp<=0)continue;
  const min=unitRadius(a)+unitRadius(b),dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d>=min-.01)continue;
  const nx=d>0?dx/d:1,ny=d>0?dy/d:0,overlap=(min-d)/2+.05;
  const ax=a.x-nx*overlap,ay=a.y-ny*overlap,bx=b.x+nx*overlap,by=b.y+ny*overlap;
  const aFree=isWalkable(w,ax,ay,unitRadius(a)),bFree=isWalkable(w,bx,by,unitRadius(b));
  if(aFree&&bFree){a.x=ax;a.y=ay;b.x=bx;b.y=by;}
  else if(aFree){a.x-=nx*overlap*2;a.y-=ny*overlap*2;}
  else if(bFree){b.x+=nx*overlap*2;b.y+=ny*overlap*2;}
 }
}
function spawnNear(w,b,kind){
 const unit=makeUnit(w,kind,b.team,b.x,b.y),radius=TYPES[b.kind].radius+unitRadius(unit)+10;
 for(let ring=0;ring<6;ring++)for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,r=radius+ring*unitRadius(unit)*2,x=b.x+Math.cos(angle)*r,y=b.y+Math.sin(angle)*r;
  if(unitSpotFree(w,unit,x,y)){unit.x=x;unit.y=y;return unit;}
 }
 return null;
}
function nearestTown(w,u){return w.buildings.filter(b=>b.team===u.team&&b.kind==='town'&&b.hp>0).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];}
function clearApproach(a,b){const distance=Math.hypot(a.x-b.x,a.y-b.y);for(let d=8;d<distance;d+=8){const t=d/distance;if(terrainBlocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,MAP.width,MAP.height))return false;}return true;}
export function combatDamage(attacker,target,w=null){
 const bonus=COMBAT.counters[attacker.kind]===target.kind?COMBAT.counterMultiplier:1;
 return Math.max(1,Math.round(statValue(w,attacker.team,attacker.kind,'damage')*bonus-statValue(w,target.team,target.kind,'armor')));
}
function tickProjectiles(w,dt){
 w.projectiles=(w.projectiles||[]).filter(p=>{
  const target=getEntity(w,p.targetId);
  if(!target||target.hp<=0)return false;
  const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy),step=Math.min(COMBAT.projectileSpeed*dt,p.maxDistance-p.travelled);
  if(step<=0)return false;
  const travel=Math.min(step,d),nx=p.x+(d?dx/d*travel:0),ny=p.y+(d?dy/d*travel:0);
  if(terrainBlocked(nx,ny,MAP.width,MAP.height))return false;
  p.x=nx;p.y=ny;p.travelled+=travel;
  if(d<=travel+(target.type==='building'?TYPES[target.kind].radius:unitRadius(target))){
   if(target.team!==p.team)target.hp-=p.damage;
   return false;
  }
  return p.travelled<p.maxDistance;
 });
}
function tickUnit(w,u,dt){
 if(u.hp<=0)return;
 if(u.order?.automatic){
  const current=getEntity(w,u.order.target);
  if(!current||current.hp<=0){
   u.order=u.resumeOrder||null;u.resumeOrder=null;u.path=[];
   if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
   else if(u.order?.target){const goal=getEntity(w,u.order.target);if(goal&&goal.hp>0)setDestination(w,u,goal.x,goal.y);else u.order=null;}
  }
 }
 if(['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&!(u.order?.type==='attack'&&getEntity(w,u.order.target)?.type==='unit'&&!u.order.automatic)){
  const current=u.order?.automatic?getEntity(w,u.order.target):null;
  const foe=current?.hp>0&&current.team!==u.team&&Math.hypot(current.x-u.x,current.y-u.y)<COMBAT.acquisitionRadius+50?current:w.units.filter(other=>other.team!==u.team&&other.hp>0&&Math.hypot(other.x-u.x,other.y-u.y)<=COMBAT.acquisitionRadius&&clearApproach(u,other)).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
  if(foe&&!(u.order?.automatic&&u.order.target===foe.id)){
   if(!u.order?.automatic)u.resumeOrder=u.order;
   u.order={type:'attack',target:foe.id,automatic:true};u.path=[];setDestination(w,u,foe.x,foe.y);
  }
 }
 if(!u.order)return;const o=u.order;if(o.type==='move'){stepMove(w,u,dt);if(!u.path.length)u.order=null;return;}const target=getEntity(w,o.target);if(!target||target.hp!==undefined&&target.hp<=0||target.amount!==undefined&&target.amount<=0&&u.carry===0){u.order=null;u.path=[];if(u.team==='enemy'&&u.raidWave){const town=w.buildings.find(b=>b.team==='player'&&b.kind==='town'&&b.hp>0);if(town)sendRaid(w,u,town,u.raidBridge||0);}return;}if(o.type==='deliver'){if(Math.hypot(u.x-target.x,u.y-target.y)>TYPES[target.kind].radius+32||!clearApproach(u,target)){if(!u.path.length)setApproach(w,u,target);stepMove(w,u,dt);return;}if(u.carry&&u.carryKind)w.stock[u.team][u.carryKind]+=u.carry;u.carry=0;u.carryKind=null;u.order=null;u.path=[];return;}if(o.type==='gather'){const town=nearestTown(w,u);if(!town)return;if(u.carry>=10||target.amount<=0){if(Math.hypot(u.x-town.x,u.y-town.y)>TYPES.town.radius+32||!clearApproach(u,town)){if(!u.path.length)setApproach(w,u,town);stepMove(w,u,dt);return;}w.stock[u.team][u.carryKind||target.kind]+=u.carry;u.carry=0;u.carryKind=null;if(target.amount<=0){u.order=null;return;}u.path=[];}if(Math.hypot(u.x-target.x,u.y-target.y)>30||!clearApproach(u,target)){if(!u.path.length)setDestination(w,u,target.x,target.y);stepMove(w,u,dt);return;}u.path=[];u.work+=dt;if(u.work>=.65/statValue(w,u.team,u.kind,'gatherSpeed')){u.work=0;const take=Math.min(2,10-u.carry,target.amount);target.amount-=take;u.carry+=take;u.carryKind=target.kind;}return;}if(o.type==='build'){if(target.complete){u.order=null;return;}if(Math.hypot(u.x-target.x,u.y-target.y)>TYPES[target.kind].radius+36||!clearApproach(u,target)){if(!u.path.length)setApproach(w,u,target);stepMove(w,u,dt);return;}u.path=[];target.progress+=dt;target.hp=Math.min(target.maxHp,target.hp+target.maxHp/TYPES[target.kind].time*dt);if(target.progress>=TYPES[target.kind].time){target.complete=true;target.hp=target.maxHp;u.order=null;}return;}if(o.type==='attack'){const range=TYPES[u.kind].attackRange+(target.type==='building'?TYPES[target.kind].radius:0);if(Math.hypot(u.x-target.x,u.y-target.y)>range||!clearApproach(u,target)){if(!u.path.length)setDestination(w,u,target.x,target.y);stepMove(w,u,dt);return;}u.path=[];u.cooldown-=dt;if(u.cooldown<=0){if(u.kind==='archer'){w.projectiles.push({x:u.x,y:u.y,targetId:target.id,team:u.team,damage:combatDamage(u,target,w),travelled:0,maxDistance:COMBAT.projectileMaxDistance});}else{target.hp-=combatDamage(u,target,w);if(u.kind==='mythic')for(const other of w.units)if(other!==target&&other.team!==u.team&&other.hp>0&&Math.hypot(other.x-target.x,other.y-target.y)<55)other.hp-=Math.round(combatDamage(u,other,w)*.4);}u.cooldown=TYPES[u.kind].attackSpeed;}return;}}
export function getOutcome(w){const ours=w.buildings.some(b=>b.team==='player'&&b.kind==='town'&&b.hp>0),theirs=w.buildings.some(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);return !ours?'lost':!theirs?'won':'playing';}
function manageEnemyEconomy(w,dt){
 const settings=aiSettings(w);
 const workers=w.units.filter(u=>u.team==='enemy'&&u.kind==='worker'&&u.hp>0);
 const town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);
 if(!town)return;
 const jobs=['food','wood','gold','food','wood','stone','food','gold','food','wood'];
 for(let i=0;i<workers.length;i++)if(!workers[i].jobKind)workers[i].jobKind=jobs[i%jobs.length];
 if(w.difficulty!=='easy'&&w.time>180){
  const goldWorkers=workers.filter(u=>u.jobKind==='gold').length;
  if(goldWorkers<3&&workers.filter(u=>u.jobKind==='food').length>3&&w.stock.enemy.food>160){
   const miner=workers.find(u=>u.jobKind==='food'&&u.carry===0&&u.order?.type!=='build');
   if(miner){miner.jobKind='gold';miner.order=null;miner.path=[];}
  }
 }
 const goal=settings.workerGoals[Math.min(Math.floor(w.time/230),settings.workerGoals.length-1)];
 w.aiWorkerClock=(w.aiWorkerClock||0)+dt;
 if(w.aiWorkerClock>=settings.workerInterval){
  w.aiWorkerClock=0;
  if(workers.length+town.queue.length<goal&&town.queue.length===0&&population(w,'enemy').used<population(w,'enemy').max)queueUnit(w,town.id,'worker','enemy');
 }
 if(!workers.length)return;
 const planning=w.time>=(w.aiNextPlan||0);
 if(planning)w.aiNextPlan=w.time+settings.thinkInterval;
 let site=w.buildings.find(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0);
 if(planning&&w.time>=settings.barracksDelay&&!site){
  const builder=workers.find(u=>u.jobKind==='wood')||workers[0];
  const result=startConstruction(w,[builder.id],'barracks',w.enemyBarracksSite.x,w.enemyBarracksSite.y,'enemy');
  if(result.ok){site=result.building;w.enemyBarracksStarted=true;}
 }
 if(site&&!site.complete&&!workers.some(u=>u.order?.type==='build'&&u.order.target===site.id)){
  const builder=workers.find(u=>u.jobKind==='wood')||workers[0];
  builder.order={type:'build',target:site.id};setApproach(w,builder,site);
 }
 // One construction per worker; keep the original barracks builder on its site.
 const unfinished=w.buildings.filter(b=>b.team==='enemy'&&!b.complete&&b.hp>0);
 if(planning&&site?.complete&&w.time>=settings.secondBarracksAt&&w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0).length<2&&affordable(w,'enemy',TYPES.barracks.cost)&&!unfinished.some(b=>b.kind==='barracks')){
  const builder=workers.find(u=>u.jobKind==='stone'&&u.order?.type!=='build')||workers.find(u=>u.order?.type!=='build');
  if(builder)for(const radius of [225,265,305]){
   for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.barracks.radius,true))continue;
    if(startConstruction(w,[builder.id],'barracks',x,y,'enemy').ok)break;
   }
   if(w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks').length>=2)break;
  }
 }
 const pop=population(w,'enemy');
 if(planning&&pop.used>=pop.max-2&&!unfinished.some(b=>b.kind==='house')&&affordable(w,'enemy',TYPES.house.cost)){
  const builder=workers.find(u=>u.jobKind==='wood'&&u.order?.type!=='build')||workers.find(u=>u.order?.type!=='build');
  if(builder)for(const radius of [155,190,245,295,350]){
   for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.house.radius,true))continue;
    if(startConstruction(w,[builder.id],'house',x,y,'enemy').ok)break;
   }
   if(w.buildings.some(b=>b.team==='enemy'&&b.kind==='house'&&!b.complete))break;
  }
 }
 for(const building of w.buildings.filter(b=>b.team==='enemy'&&!b.complete&&b.hp>0)){
  if(workers.some(u=>u.order?.type==='build'&&u.order.target===building.id))continue;
  const builder=workers.find(u=>u.order?.type!=='build');
  if(builder){builder.order={type:'build',target:building.id};setApproach(w,builder,building);}
 }
 const stoneGoal=currentAge(w,'enemy')>=2?AGES[3].cost.stone+TYPES.workshop.cost.stone:TYPES.barracks.cost.stone+30;
 if(w.stock.enemy.stone>=stoneGoal){
  for(const u of workers.filter(u=>u.jobKind==='stone'&&u.carry===0&&u.order?.type!=='build')){
   u.jobKind='wood';u.order=null;u.path=[];
  }
 }
 if(w.time>=130&&w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0).length<2&&w.stock.enemy.stone<TYPES.barracks.cost.stone&&!workers.some(u=>u.jobKind==='stone')){
  const miner=workers.find(u=>u.jobKind==='wood'&&u.carry===0&&u.order?.type!=='build');
  if(miner){miner.jobKind='stone';miner.order=null;miner.path=[];}
 }
 if(currentAge(w,'enemy')>=2&&w.stock.enemy.stone<stoneGoal&&!workers.some(u=>u.jobKind==='stone')){
  const miner=workers.find(u=>u.jobKind==='wood'&&u.carry===0&&u.order?.type!=='build');
  if(miner){miner.jobKind='stone';miner.order=null;miner.path=[];}
 }
 for(const u of workers){
  if(u.order)continue;
  const nodes=w.nodes.filter(n=>n.kind===u.jobKind&&n.amount>0);
  nodes.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
  for(const node of nodes){if(setDestination(w,u,node.x,node.y)){u.order={type:'gather',target:node.id};break;}}
 }
}
function manageEnemyProgress(w){
 if(w.time<(w.aiNextAgePlan||0))return;
 w.aiNextAgePlan=w.time+aiSettings(w).thinkInterval;
 const team='enemy',age=currentAge(w,team),town=w.buildings.find(b=>b.team===team&&b.kind==='town'&&b.hp>0);
 if(!town)return;
 const barracks=w.buildings.filter(b=>b.team===team&&b.kind==='barracks'&&b.complete&&b.hp>0);
 if(age===1){
  if(w.time>=aiSettings(w).ageDelay&&barracks.length>=2&&(w.difficulty!=='hard'||w.aiWavesSent>0))beginAge(w,town.id,team);
  return;
 }
 const workshops=w.buildings.filter(b=>b.team===team&&b.kind==='workshop'&&b.hp>0);
 if(!workshops.length&&w.time>=260&&barracks.length>=2){
  const worker=w.units.find(u=>u.team===team&&u.kind==='worker'&&u.hp>0&&u.order?.type!=='build');
  if(worker&&affordable(w,team,TYPES.workshop.cost))for(const radius of [210,265,325]){
   for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.workshop.radius,true))continue;
    if(startConstruction(w,[worker.id],'workshop',x,y,team).ok)break;
   }
   if(w.buildings.some(b=>b.team===team&&b.kind==='workshop'))break;
  }
 }
 const shop=workshops.find(b=>b.complete);
 if(age===2&&w.time>=aiSettings(w).ageIIIAt&&w.aiWavesSent>=(aiSettings(w).ageIIIWaves||0)){beginAge(w,town.id,team);return;}
 if(age===3&&w.aiWavesSent<3)return;
 if(age===2&&w.difficulty==='normal'&&w.aiWavesSent<2)return;
 if(!shop||shop.research||w.time<270)return;
 const priorities=age===2?['harvest','forgedBlades']:['reinforcedArmor','vitality','boots','forgedBladesII','harvestII','reinforcedArmorII','vitalityII','bootsII'];
 for(const key of priorities)if(beginResearch(w,shop.id,key,team).ok)break;
}
function waveStage(w){
 const stages=aiSettings(w).waveStages;
 return [...stages].reverse().find(stage=>w.time>=stage.after)||stages[0];
}
function sendRaid(w,u,town,bridgeIndex){
 const [px,py]=AI.bridges[bridgeIndex],bridge={x:px/MAP.imageWidth*MAP.width,y:py/MAP.imageHeight*MAP.height};
 const approach={x:town.x+(TYPES[town.kind].radius||15)+35,y:town.y};
 const first=findPath(w,u,bridge,u),second=findPath(w,bridge,approach,u);
 u.order={type:'attack',target:town.id};u.raidBridge=bridgeIndex;
 if(first.length&&second.length)u.path=[...first,...second];
 else setDestination(w,u,town.x,town.y);
}
function defendEnemyBase(w){
 const settings=aiSettings(w);
 const base=w.buildings.filter(b=>b.team==='enemy'&&b.hp>0);
 const intruders=w.units.filter(u=>u.team==='player'&&u.hp>0&&base.some(b=>Math.hypot(u.x-b.x,u.y-b.y)<TYPES[b.kind].radius+settings.defenseRadius));
 if(intruders.length){
  w.aiThreatUntil=w.time+settings.defenseQuiet;
  const town=base.find(b=>b.kind==='town')||base[0];
  if(currentAge(w,'enemy')>=3&&town.kind==='town'){
   usePower(w,town.id,'storm','enemy');usePower(w,town.id,'healing','enemy');
  }
  const military=w.units.filter(u=>u.team==='enemy'&&['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&u.hp>0);
  military.sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y));
  const defenders=military.filter(u=>Math.hypot(u.x-town.x,u.y-town.y)<=settings.defenderRadius);
  if(!defenders.length&&military.length)defenders.push(military[0]);
  for(const u of defenders.slice(0,Math.min(settings.defenderLimit,Math.max(2,intruders.length*2)))){
   const target=intruders.reduce((closest,other)=>!closest||Math.hypot(other.x-u.x,other.y-u.y)<Math.hypot(closest.x-u.x,closest.y-u.y)?other:closest,null);
   if(!u.defenseOrder)u.defenseOrder=u.resumeOrder||u.order||{type:'hold'};
   u.resumeOrder=null;
   if(u.order?.target!==target.id||u.order?.type!=='attack'){
    u.order={type:'attack',target:target.id};setDestination(w,u,target.x,target.y);
   }
  }
 }
 if(w.time<(w.aiThreatUntil||0))return;
 for(const u of w.units.filter(u=>u.team==='enemy'&&u.defenseOrder)){
  const original=u.defenseOrder;u.defenseOrder=null;u.resumeOrder=null;
  u.order=original.type==='hold'?null:original;
  if(u.raidWave&&u.order?.type==='attack'){
   const town=getEntity(w,u.order.target);
   if(town?.hp>0){sendRaid(w,u,town,u.raidBridge||0);continue;}
  }
  if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
  else if(u.order?.target){const target=getEntity(w,u.order.target);if(target?.hp>0)setDestination(w,u,target.x,target.y);else u.order=null;}
  else u.path=[];
 }
}
function enemyCanSee(w,entity){
 return [...w.units,...w.buildings].some(observer=>observer.team==='enemy'&&observer.hp>0&&(observer.type!=='building'||observer.complete)&&Math.hypot(observer.x-entity.x,observer.y-entity.y)<=TYPES[observer.kind].visionRadius);
}
function updateEnemyCounters(w){
 if(!aiSettings(w).counterUnits||w.time<(w.aiCounterNext||0))return;
 w.aiCounterNext=w.time+(aiSettings(w).counterInterval||25);
 const known=w.units.filter(u=>u.team==='player'&&u.hp>0&&u.kind!=='worker'&&enemyCanSee(w,u));
 const count=kind=>known.filter(u=>u.kind===kind).length;
 const counters={spearman:count('cavalry')+count('mythic'),cavalry:count('archer'),archer:count('soldier')+count('champion')};
 const strongest=Object.entries(counters).sort((a,b)=>b[1]-a[1])[0];
 // Remember a sighting briefly rather than reacting to every unit immediately.
 if(strongest[1]>=(aiSettings(w).counterThreshold||3))w.aiCounterPreference=strongest[0];
 else if(!known.length&&w.time>(w.aiLastSighting||0)+100)w.aiCounterPreference=null;
 if(known.length)w.aiLastSighting=w.time;
}
function enemyRaidTarget(w,town){
 if(w.difficulty==='easy')return town;
 const seen=w.buildings.filter(b=>b.team==='player'&&b.hp>0&&b.complete&&b.kind==='barracks'&&enemyCanSee(w,b));
 return seen[0]||town;
}
export function tickWorld(w,dt){
 if(w.outcome!=='playing')return;
 dt=Math.min(dt,.15);w.time+=dt;tickProgression(w,dt);
 manageEnemyEconomy(w,dt);manageEnemyProgress(w);updateEnemyCounters(w);
 for(const u of [...w.units])tickUnit(w,u,dt);
 tickProjectiles(w,dt);
 w.units=w.units.filter(u=>u.hp>0);
 w.buildings=w.buildings.filter(b=>b.hp>0);
 separateUnits(w);
 defendEnemyBase(w);
 for(const b of w.buildings){
  if(!b.complete||!b.queue.length)continue;
  b.spawnProgress+=dt;
  if(b.spawnProgress>=TYPES[b.queue[0]].time){
   b.spawnProgress=0;
   const kind=b.queue[0],unit=spawnNear(w,b,kind);
   if(unit){b.queue.shift();w.units.push(unit);}else b.spawnProgress=TYPES[kind].time;
  }
 }
 w.aiClock+=dt;w.raidClock+=dt;
 if(w.aiClock>=aiSettings(w).trainInterval){
  w.aiClock=0;
  const barracks=w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.complete&&b.hp>0);
  const weights=w.time<240?{soldier:3,spearman:2,archer:2,cavalry:1,champion:0,mythic:0}:w.time<500?{soldier:2,spearman:2,archer:2,cavalry:2,champion:0,mythic:0}:{soldier:2,spearman:2,archer:2,cavalry:2,champion:1,mythic:1};
  if(w.aiCounterPreference&&weights[w.aiCounterPreference])weights[w.aiCounterPreference]*=aiSettings(w).counterWeight||1.8;
  for(const b of barracks){
   if(b.queue.length||population(w,'enemy').used>=population(w,'enemy').max)continue;
   const kinds=['soldier','spearman','archer','cavalry','champion'].filter(kind=>unlocked(w,'enemy',kind)&&(w.difficulty!=='easy'||kind==='soldier'||kind==='spearman'||kind==='archer'&&w.time>500));
   const rotation=Object.fromEntries(kinds.map((kind,i)=>[kind,(i-(w.aiTrainingCount||0)%kinds.length+kinds.length)%kinds.length]));
   const counts=Object.fromEntries(kinds.map(kind=>[kind,w.units.filter(u=>u.team==='enemy'&&u.kind===kind&&u.hp>0).length+barracks.reduce((n,site)=>n+site.queue.filter(queued=>queued===kind).length,0)]));
   kinds.sort((a,b)=>counts[a]/weights[a]-counts[b]/weights[b]||rotation[a]-rotation[b]);
   const cavalryDue=unlocked(w,'enemy','cavalry')&&w.time>=240&&counts.cavalry<Math.ceil((counts.soldier+counts.spearman+counts.archer+counts.cavalry)/6);
   const reserveCavalry=cavalryDue&&!w.aiCounterPreference&&(w.stock.enemy.gold<TYPES.cavalry.resourceCost.gold||w.stock.enemy.food<TYPES.cavalry.resourceCost.food);
   const reservingAge=w.time>=aiSettings(w).ageDelay+10&&currentAge(w,'enemy')===1&&(w.difficulty!=='hard'||w.aiWavesSent>0)||w.time>=aiSettings(w).ageIIIAt+10&&currentAge(w,'enemy')===2&&w.aiWavesSent>=(aiSettings(w).ageIIIWaves||0);
   if(reservingAge&&barracks.length>=2)continue;
   for(const kind of kinds){
    if(reserveCavalry&&kind!=='cavalry')continue;
    if(queueUnit(w,b.id,kind,'enemy').ok){w.aiTrainingCount=(w.aiTrainingCount||0)+1;break;}
   }
  }
  if(currentAge(w,'enemy')>=3){
   const shop=w.buildings.find(b=>b.team==='enemy'&&b.kind==='workshop'&&b.complete&&b.hp>0&&!b.research&&!b.queue.length);
   if(shop&&w.units.filter(u=>u.team==='enemy'&&u.kind==='mythic').length<1)queueUnit(w,shop.id,'mythic','enemy');
  }
 }
 if(w.aiWaveActive&&!w.units.some(u=>u.team==='enemy'&&u.raidWave))w.aiWaveActive=false;
 const stage=waveStage(w);
 if(!w.aiWaveActive&&w.time>=(w.aiThreatUntil||0)&&w.raidClock>=stage.cooldown){
  const squad=w.units.filter(u=>u.team==='enemy'&&['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&!u.raidWave&&u.hp>0&&!u.defenseOrder);
  const town=w.buildings.find(b=>b.team==='player'&&b.kind==='town'),size=stage.size;
  const secure=w.time>=(w.aiThreatUntil||0)&&w.buildings.some(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);
  if(town&&secure&&squad.length>=size){
   w.aiWaveActive=true;w.aiWavesSent++;w.raidClock=0;
   const bridge=(w.aiWavesSent-1)%AI.bridges.length;
   const primary=enemyRaidTarget(w,town);
   const workers=w.units.filter(u=>u.team==='player'&&u.kind==='worker'&&u.hp>0&&enemyCanSee(w,u));
   const secondary=workers[0]||town;
   const flank=aiSettings(w).multiAttack&&size>=14?Math.max(4,Math.floor(size*.25)):0;
   for(const [i,u] of squad.slice(0,size).entries()){
    u.raidWave=true;sendRaid(w,u,i>=size-flank?secondary:primary,i>=size-flank?(bridge+1)%AI.bridges.length:bridge);
   }
  }
 }
 updateVision(w);
 w.outcome=getOutcome(w);
}
