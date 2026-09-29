import {AGES,TECHNOLOGIES,POWERS,TYPES,UNLOCK_AGE} from './data.js';
import {fogAt} from './fog.js';

const fail=reason=>({ok:false,reason});
const canPayProgress=(w,team,cost)=>Object.entries(cost).every(([key,amount])=>(w.stock[team]?.[key]||0)>=amount);
const payProgress=(w,team,cost)=>{for(const [key,amount] of Object.entries(cost))w.stock[team][key]-=amount;};
export const currentAge=(w,team='player')=>w.progression?.[team]?.age||1;
export const unlocked=(w,team,kind)=>currentAge(w,team)>=(UNLOCK_AGE[kind]||1);

export function statValue(w,team,kind,stat){
 let result=stat==='gatherSpeed'?1:(TYPES[kind]?.[stat]||0);
 for(const key of w?.progression?.[team]?.techs||[]){
  for(const effect of TECHNOLOGIES[key]?.effects||[]){
   const matches=effect.scope==='units'||effect.scope==='worker'&&kind==='worker'||effect.scope==='military'&&kind!=='worker'&&TYPES[kind]?.populationCost;
   if(matches&&effect.stat===stat)result=result*(effect.multiplier||1)+(effect.add||0);
  }
 }
 return result;
}

export function beginAge(w,townId,team='player'){
 const town=w.buildings.find(b=>b.id===townId&&b.kind==='town'&&b.team===team&&b.complete&&b.hp>0);
 if(!town)return fail('Sélectionne ton sanctuaire');
 const next=currentAge(w,team)+1;
 if(!AGES[next])return fail('Âge maximal atteint');
 if(w.buildings.some(b=>b.team===team&&b.research?.type==='age'))return fail('Un âge est déjà en préparation');
 if(town.research||town.queue.length)return fail('Sanctuaire occupé');
 if(!canPayProgress(w,team,AGES[next].cost))return fail('Ressources insuffisantes');
 payProgress(w,team,AGES[next].cost);town.research={type:'age',key:next,progress:0};
 return {ok:true};
}

export function beginResearch(w,workshopId,key,team='player'){
 const def=TECHNOLOGIES[key],shop=w.buildings.find(b=>b.id===workshopId&&b.kind==='workshop'&&b.team===team&&b.complete&&b.hp>0);
 if(!shop)return fail('Sélectionne un atelier terminé');
 if(!def)return fail('Technologie inconnue');
 if(currentAge(w,team)<def.age)return fail(`Requiert l’${AGES[def.age].label}`);
 if(w.progression[team].techs.includes(key)||w.buildings.some(b=>b.team===team&&b.research?.type==='tech'&&b.research.key===key))return fail('Recherche déjà acquise ou en cours');
 if(def.requires&&!w.progression[team].techs.includes(def.requires))return fail('Amélioration précédente requise');
 if(shop.research||shop.queue.length)return fail('Atelier occupé');
 if(!canPayProgress(w,team,def.cost))return fail('Ressources insuffisantes');
 payProgress(w,team,def.cost);shop.research={type:'tech',key,progress:0};
 return {ok:true};
}

export function tickProgression(w,dt){
 for(const building of w.buildings){
  const job=building.research;
  if(!job||building.hp<=0||!building.complete)continue;
  const duration=job.type==='age'?AGES[job.key].time:TECHNOLOGIES[job.key].time;
  job.progress+=dt;
  if(job.progress+1e-8<duration)continue;
  if(job.type==='age')w.progression[building.team].age=job.key;
  else{
   w.progression[building.team].techs.push(job.key);
   for(const unit of w.units.filter(u=>u.team===building.team&&u.hp>0&&u.type==='unit')){
    const max=Math.round(statValue(w,unit.team,unit.kind,'hp'));
    if(max>unit.maxHp){unit.hp=Math.min(max,unit.hp+max-unit.maxHp);unit.maxHp=max;}
   }
  }
  building.research=null;
 }
}

export function usePower(w,townId,key,team='player'){
 const power=POWERS[key],town=w.buildings.find(b=>b.id===townId&&b.kind==='town'&&b.team===team&&b.complete&&b.hp>0);
 if(!town)return fail('Sanctuaire indisponible');
 if(!power)return fail('Pouvoir inconnu');
 if(currentAge(w,team)<power.age)return fail(`Requiert l’${AGES[power.age].label}`);
 if((w.progression[team].readyAt[key]||0)>w.time)return fail('Pouvoir en recharge');
 if(!canPayProgress(w,team,power.cost))return fail('Ressources insuffisantes');
 let targets=[];
 if(key==='healing')targets=w.units.filter(u=>u.team===team&&u.hp>0&&u.hp<u.maxHp&&Math.hypot(u.x-town.x,u.y-town.y)<=power.radius);
 else{
  const enemies=w.units.filter(u=>u.team!==team&&u.hp>0&&Math.hypot(u.x-town.x,u.y-town.y)<=power.radius&&(team!=='player'||fogAt(w,u.x,u.y)===2));
  enemies.sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y));
  if(enemies.length)targets=w.units.filter(u=>u.team!==team&&u.hp>0&&Math.hypot(u.x-enemies[0].x,u.y-enemies[0].y)<=power.blastRadius);
 }
 if(!targets.length)return fail(key==='storm'?'Aucun ennemi visible à portée':'Aucun allié blessé à portée');
 payProgress(w,team,power.cost);
 for(const target of targets)if(key==='healing')target.hp=Math.min(target.maxHp,target.hp+power.heal);
 else target.hp=Math.max(0,target.hp-Math.max(1,power.damage-statValue(w,target.team,target.kind,'armor')));
 w.progression[team].readyAt[key]=w.time+power.cooldown;
 return {ok:true,targets:targets.length};
}
