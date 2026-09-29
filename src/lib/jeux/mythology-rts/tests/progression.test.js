import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,makeBuilding,makeUnit} from '../js/world.js';
import {AGES,TECHNOLOGIES,POWERS,TYPES} from '../js/data.js';
import {beginAge,beginResearch,usePower,statValue} from '../js/progression.js';
import {queueUnit,startConstruction,tickWorld,combatDamage} from '../js/game.js';

const isolated=()=>{const w=createWorld();w.aiClock=w.raidClock=w.aiWorkerClock=-100000;return w;};
const grant=(w,team)=>Object.assign(w.stock[team],{food:3000,wood:3000,gold:3000,stone:3000});
const advance=(w,team,age)=>{grant(w,team);const town=w.buildings.find(b=>b.team===team&&b.kind==='town');assert.equal(beginAge(w,town.id,team).ok,true);for(let t=0;t<AGES[age].time+.2;t+=.1)tickWorld(w,.1);assert.equal(w.progression[team].age,age);};

test('starts at Age I and locks Age II units and workshop',()=>{
 const w=isolated(),b=makeBuilding(w,'barracks','player',700,370);w.buildings.push(b);
 assert.equal(w.progression.player.age,1);
 for(const kind of ['soldier','spearman'])assert.equal(queueUnit(w,b.id,kind).ok,true);
 for(const kind of ['archer','cavalry','champion'])assert.equal(queueUnit(w,b.id,kind).ok,false);
 const wood=w.stock.player.wood;
 assert.equal(startConstruction(w,[w.units[0].id],'workshop',700,370).ok,false);
 assert.equal(w.stock.player.wood,wood);
});
test('age advance pays resources, occupies the town and unlocks content only after completion',()=>{
 const w=isolated(),town=w.buildings.find(b=>b.team==='player'&&b.kind==='town');grant(w,'player');
 const cost=AGES[2].cost,before={...w.stock.player};
 assert.equal(beginAge(w,town.id,'player').ok,true);
 assert.equal(w.stock.player.food,before.food-cost.food);
 assert.equal(w.stock.player.gold,before.gold-cost.gold);
 assert.equal(beginAge(w,town.id,'player').ok,false);
 assert.equal(queueUnit(w,town.id,'worker').ok,false);
 for(let t=0;t<AGES[2].time-.3;t+=.1)tickWorld(w,.1);
 assert.equal(w.progression.player.age,1);
 tickWorld(w,.5);tickWorld(w,.5);tickWorld(w,.5);
 assert.equal(w.progression.player.age,2);
 assert.equal(beginAge(w,town.id,'player').ok,true,'Age III is available after II');
});
test('workshop researches configurable benefits that affect existing and new units',()=>{
 const w=isolated();advance(w,'player',2);
 const shop=makeBuilding(w,'workshop','player',720,390);w.buildings.push(shop);
 const soldier=makeUnit(w,'soldier','player',800,440),enemy=makeUnit(w,'soldier','enemy',900,440);w.units.push(soldier,enemy);
 const baseDamage=combatDamage(soldier,enemy,w),originalHp=soldier.maxHp;
 assert.equal(beginResearch(w,shop.id,'forgedBlades').ok,true);
 assert.equal(beginResearch(w,shop.id,'reinforcedArmor').ok,false,'one research per workshop');
 for(let t=0;t<TECHNOLOGIES.forgedBlades.time+.2;t+=.1)tickWorld(w,.1);
 assert.ok(w.progression.player.techs.includes('forgedBlades'));
 assert.ok(combatDamage(soldier,enemy,w)>baseDamage);
 assert.equal(beginResearch(w,shop.id,'forgedBlades').ok,false,'tech cannot be paid twice');
 assert.equal(beginResearch(w,shop.id,'vitality').ok,true);
 for(let t=0;t<TECHNOLOGIES.vitality.time+.2;t+=.1)tickWorld(w,.1);
 assert.ok(soldier.maxHp>originalHp);
 assert.equal(makeUnit(w,'soldier','player',860,450).maxHp,soldier.maxHp);
 assert.equal(beginResearch(w,shop.id,'harvest').ok,true);
 for(let t=0;t<TECHNOLOGIES.harvest.time+.2;t+=.1)tickWorld(w,.1);
 assert.ok(statValue(w,'player','worker','gatherSpeed')>1);
});
test('Age III adds advanced and mythic units plus two paid cooldown powers',()=>{
 const w=isolated();advance(w,'player',2);advance(w,'player',3);
 assert.equal(w.progression.player.age,3);
 const barracks=makeBuilding(w,'barracks','player',700,370),shop=makeBuilding(w,'workshop','player',770,370);
 w.buildings.push(barracks,shop,makeBuilding(w,'house','player',850,370));
 assert.equal(queueUnit(w,barracks.id,'champion').ok,true);
 assert.equal(queueUnit(w,shop.id,'mythic').ok,true);
 const soldier=makeUnit(w,'soldier','player',w.buildings[0].x+100,w.buildings[0].y);
 soldier.hp=20;w.units.push(soldier);
 const town=w.buildings.find(b=>b.team==='player'&&b.kind==='town');
 assert.equal(usePower(w,town.id,'healing').ok,true);
 assert.ok(soldier.hp>20);
 assert.equal(usePower(w,town.id,'healing').ok,false);
 const foe=makeUnit(w,'soldier','enemy',town.x+130,town.y);w.units.push(foe);
 assert.equal(usePower(w,town.id,'storm').ok,true);
 assert.ok(foe.hp<foe.maxHp);
 assert.ok(POWERS.storm.cost.gold>0&&TYPES.mythic.populationCost>1);
});
test('armor and movement research use the same stat registry',()=>{
 const w=isolated();advance(w,'player',2);
 const shop=makeBuilding(w,'workshop','player',710,380),attacker=makeUnit(w,'soldier','player',900,400),enemy=makeUnit(w,'soldier','enemy',940,400);
 w.buildings.push(shop);w.units.push(attacker,enemy);
 const speed=statValue(w,'player','worker','movementSpeed'),damage=combatDamage(enemy,attacker,w);
 for(const key of ['boots','reinforcedArmor']){
  assert.equal(beginResearch(w,shop.id,key).ok,true);
  for(let t=0;t<TECHNOLOGIES[key].time+.2;t+=.1)tickWorld(w,.1);
 }
 assert.ok(statValue(w,'player','worker','movementSpeed')>speed);
 assert.equal(combatDamage(enemy,attacker,w),damage-1);
});
test('AI advances from its own resources after assembling its base',()=>{
 const w=isolated();grant(w,'enemy');
 w.buildings.push(makeBuilding(w,'barracks','enemy',2460,1630),makeBuilding(w,'barracks','enemy',2710,1630));
 const town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 w.time=260;tickWorld(w,.1);
 assert.equal(town.research?.type,'age');
 for(let t=0;t<AGES[2].time+.2;t+=.1)tickWorld(w,.1);
 assert.equal(w.progression.enemy.age,2);
 grant(w,'enemy');w.time=550;w.aiWavesSent=3;w.aiNextAgePlan=0;tickWorld(w,.1);
 assert.equal(town.research?.key,3);
 for(let t=0;t<AGES[3].time+.2;t+=.1)tickWorld(w,.1);
 assert.equal(w.progression.enemy.age,3);
});
