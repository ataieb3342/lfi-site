import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld, makeUnit, makeBuilding, findPath} from '../js/world.js';
import {screenToWorld, worldToScreen} from '../js/camera.js';
import {TYPES,AI} from '../js/data.js';
import {orderMove, orderGather, startConstruction, queueUnit, tickWorld, orderAttack, getOutcome, combatDamage, population} from '../js/game.js';

test('world starts with town, three workers and enemy camp',()=>{const w=createWorld();assert.equal(w.units.filter(u=>u.team==='player').length,3);assert.equal(w.buildings.filter(b=>b.team==='player'&&b.kind==='town').length,1);assert.ok(w.nodes.some(n=>n.kind==='gold'));});
test('camera round trip after zoom and pan',()=>{const c={x:700,y:400,zoom:1.7,width:900,height:600};const p={x:360,y:1000};const s=worldToScreen(c,p.x,p.y);const a=screenToWorld(c,s.x,s.y);assert.ok(Math.abs(a.x-p.x)<.001);assert.ok(Math.abs(a.y-p.y)<.001);});
test('move rejects outside map and path avoids buildings',()=>{const w=createWorld(),u=w.units[0];assert.equal(orderMove(w,[u.id],-1,-1).ok,false);w.buildings.push(makeBuilding(w,'house','enemy',450,480,true));const path=findPath(w,{x:300,y:480},{x:650,y:480});assert.ok(path.length);assert.ok(path.every(p=>Math.hypot(p.x-450,p.y-480)>48));});
test('worker collects, deposits and cannot overdraw exhausted node',()=>{const w=createWorld(),u=w.units[0],n=w.nodes.find(n=>n.kind==='wood'),startingWood=w.stock.player.wood;n.amount=3;u.x=n.x+12;u.y=n.y+12;assert.equal(orderGather(w,[u.id],n.id).ok,true);for(let i=0;i<600;i++)tickWorld(w,.1);assert.equal(n.amount,0);assert.ok(w.stock.player.wood>=startingWood+3);assert.ok(w.stock.player.wood<startingWood+10);});
test('a worker can pass an idle ally near the town and deliver food',()=>{
 const w=createWorld(),u=w.units[1],startingFood=w.stock.player.food;
 const food=w.nodes.filter(n=>n.kind==='food').sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
 w.aiClock=w.raidClock=-100000;
 assert.equal(orderGather(w,[u.id],food.id).ok,true);
 for(let i=0;i<800;i++)tickWorld(w,.1);
 assert.ok(w.stock.player.food>startingFood,'worker must go around the idle ally and return to the town');
});
test('three workers sharing one resource keep depositing rather than circling the town',()=>{
 const w=createWorld(),n=w.nodes.find(n=>n.kind==='food'&&n.x>600&&n.x<750);
 w.aiClock=w.raidClock=-100000;
 for(const u of w.units.filter(u=>u.team==='player'))assert.equal(orderGather(w,[u.id],n.id).ok,true);
 for(let i=0;i<2800;i++)tickWorld(w,.05);
 assert.ok(w.stock.player.food>=850,'all workers should keep making deliveries after the initial trips');
});
test('insufficient resources prevent training and building',()=>{const w=createWorld();w.stock.player.wood=0;const town=w.buildings.find(b=>b.team==='player');assert.equal(startConstruction(w,[w.units[0].id],'house',350,350).ok,false);w.stock.player.food=0;assert.equal(queueUnit(w,town.id,'worker').ok,false);});
test('construction and training complete',()=>{const w=createWorld(),u=w.units[0];w.aiClock=-100000;w.raidClock=-100000;assert.equal(startConstruction(w,[u.id],'barracks',700,370).ok,true);for(let i=0;i<400;i++)tickWorld(w,.1);const b=w.buildings.find(b=>b.kind==='barracks'&&b.team==='player');assert.equal(b.complete,true);assert.equal(queueUnit(w,b.id,'soldier').ok,true);for(let i=0;i<260;i++)tickWorld(w,.1);assert.ok(w.units.some(u=>u.kind==='soldier'&&u.team==='player'));});
test('destroying a town decides game and removed targets are safe',()=>{const w=createWorld(),a=makeUnit(w,'soldier','player',500,500),b=makeUnit(w,'soldier','enemy',530,500);w.units.push(a,b);orderAttack(w,[a.id],b.id);w.units=w.units.filter(u=>u.id!==b.id);tickWorld(w,.1);assert.notEqual(a.order?.type,'attack');assert.equal(getOutcome(w),'playing');w.buildings.find(b=>b.team==='enemy'&&b.kind==='town').hp=0;tickWorld(w,.1);assert.equal(getOutcome(w),'won');});
test('worker finishes a barracks then can walk away from it',()=>{const w=createWorld(),u=w.units[0];const r=startConstruction(w,[u.id],'barracks',700,370);assert.equal(r.ok,true);for(let i=0;i<400;i++)tickWorld(w,.1);assert.equal(r.building.complete,true);const initial={x:u.x,y:u.y};assert.equal(orderMove(w,[u.id],950,430).ok,true);for(let i=0;i<150;i++)tickWorld(w,.1);assert.ok(Math.hypot(u.x-initial.x,u.y-initial.y)>60,'worker must be able to leave the finished building');});
test('a building cannot be placed over an existing worker',()=>{
 const w=createWorld(),u=w.units[0];u.x=700;u.y=370;
 const before=w.stock.player.wood;
 assert.equal(startConstruction(w,[u.id],'barracks',u.x,u.y).ok,false);
 assert.equal(w.stock.player.wood,before);
 assert.equal(w.buildings.some(b=>b.team==='player'&&b.kind==='barracks'),false);
});
test('nearby opposing soldiers engage without a click',()=>{const w=createWorld(),a=makeUnit(w,'soldier','player',800,750),b=makeUnit(w,'soldier','enemy',855,750);w.units.push(a,b);for(let i=0;i<40;i++)tickWorld(w,.1);assert.ok(a.hp<a.maxHp,'player soldier should receive damage');assert.ok(b.hp<b.maxHp,'enemy soldier should receive damage');});
test('raid soldier fights a defending soldier instead of ignoring it',()=>{const w=createWorld(),a=makeUnit(w,'soldier','player',800,750),b=makeUnit(w,'soldier','enemy',850,750);w.units.push(a,b);const town=w.buildings.find(x=>x.team==='player'&&x.kind==='town');b.order={type:'attack',target:town.id};for(let i=0;i<40;i++)tickWorld(w,.1);assert.ok(a.hp<a.maxHp);assert.ok(b.hp<b.maxHp);});
test('worker resumes a paused building without paying again',async()=>{const {orderBuild}=await import('../js/game.js');const w=createWorld(),u=w.units[0],r=startConstruction(w,[u.id],'barracks',700,370);assert.equal(r.ok,true);for(let i=0;i<160;i++)tickWorld(w,.1);assert.ok(r.building.progress>0);orderMove(w,[u.id],550,700);for(let i=0;i<10;i++)tickWorld(w,.1);const paused=r.building.progress,wood=w.stock.player.wood,gold=w.stock.player.gold;for(let i=0;i<30;i++)tickWorld(w,.1);assert.equal(r.building.progress,paused);assert.equal(orderBuild(w,[u.id],r.building.id).ok,true);for(let i=0;i<250;i++)tickWorld(w,.1);assert.equal(r.building.complete,true);assert.equal(w.stock.player.wood,wood);assert.equal(w.stock.player.gold,gold);});
test('expanded map allows a route between distant sanctuaries',()=>{const w=createWorld();assert.ok(w.map.width>=3000);assert.ok(w.map.height>=1900);const p=w.buildings.find(b=>b.team==='player'&&b.kind==='town'),e=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');assert.ok(e.x>2500);assert.ok(w.nodes.some(n=>n.x>2200&&n.amount>0));const path=findPath(w,{x:p.x+80,y:p.y},{x:e.x-100,y:e.y});assert.ok(path.length>8);});
test('enemy gathers a squad before its first assault',()=>{const w=createWorld();let firstRaid=null;for(let i=0;i<3500;i++){tickWorld(w,.1);const raiders=w.units.filter(u=>u.team==='enemy'&&u.raidWave);if(raiders.length){firstRaid=raiders;break;}}assert.ok(firstRaid,'eventual assault');assert.equal(firstRaid.length,10,'first wave is assembled before departing');assert.ok(firstRaid.every(u=>u.order?.type==='attack'));});
test('enemy regroups a larger squad after the first wave is lost',()=>{const w=createWorld();for(let i=0;i<3500&&!w.units.some(u=>u.raidWave);i++)tickWorld(w,.1);assert.ok(w.units.some(u=>u.raidWave));w.units=w.units.filter(u=>!u.raidWave);let nextRaid=null;for(let i=0;i<3400;i++){tickWorld(w,.1);const raiders=w.units.filter(u=>u.team==='enemy'&&u.raidWave);if(raiders.length){nextRaid=raiders;break;}}assert.equal(nextRaid?.length,14,'second assault grows to fourteen mixed units');});
test('opening resources can fund a barracks and a full defensive squad',()=>{
 const w=createWorld(),barracks=TYPES.barracks.cost,soldier=TYPES.soldier.cost;
 assert.ok(w.stock.player.wood>=barracks.wood);
 assert.ok(w.stock.player.stone>=barracks.stone);
 assert.ok(w.stock.player.gold>=barracks.gold+5*soldier.gold);
 assert.ok(w.stock.player.food>=5*soldier.food);
});
test('crowded allied units stay separate while pursuing the same destination',()=>{
 const w=createWorld();w.aiClock=w.raidClock=-10000;
 const squad=Array.from({length:5},(_,i)=>makeUnit(w,'worker','player',700+i%3*15,370+Math.floor(i/3)*14));w.units.push(...squad);
 assert.equal(orderMove(w,squad.map(u=>u.id),950,550).ok,true);
 for(let step=0;step<150;step++){
  tickWorld(w,.05);
  for(let i=0;i<squad.length;i++)for(let j=i+1;j<squad.length;j++)assert.ok(Math.hypot(squad[i].x-squad[j].x,squad[i].y-squad[j].y)>=19.8,'units must not overlap');
 }
 assert.ok(squad.some(u=>u.x>850),'units still travel toward their destination');
});
test('two workers crossing in opposite directions finish both movement orders',()=>{
 const w=createWorld();w.aiClock=w.raidClock=-100000;
 const a=makeUnit(w,'worker','player',700,370),b=makeUnit(w,'worker','player',900,370);w.units.push(a,b);
 orderMove(w,[a.id],900,370);orderMove(w,[b.id],700,370);
 for(let i=0;i<300;i++)tickWorld(w,.05);
 assert.equal(a.order,null);assert.equal(b.order,null);
 assert.ok(a.x>820&&b.x<750);
});
test('spawned soldiers occupy distinct walkable positions',()=>{
 const w=createWorld();w.aiClock=w.raidClock=-10000;
 for(let i=0;i<600;i++)tickWorld(w,.1);
 const b=w.buildings.find(b=>b.team==='enemy'&&b.kind==='barracks');assert.equal(b?.complete,true);
 w.stock.enemy.food=500;w.stock.enemy.gold=300;
 for(let i=0;i<4;i++)assert.equal(queueUnit(w,b.id,'soldier','enemy').ok,true);
 for(let i=0;i<500;i++)tickWorld(w,.1);
 const soldiers=w.units.filter(u=>u.team==='enemy'&&u.kind==='soldier');assert.equal(soldiers.length,4);
 for(let i=0;i<soldiers.length;i++)for(let j=i+1;j<soldiers.length;j++)assert.ok(Math.hypot(soldiers[i].x-soldiers[j].x,soldiers[i].y-soldiers[j].y)>=23.8);
});
test('resource sites last longer and the enemy opens with no barracks or soldiers',()=>{
 const w=createWorld();assert.equal(w.buildings.some(b=>b.team==='enemy'&&b.kind==='barracks'),false);
 assert.ok(w.nodes.every(n=>n.amount>=600&&n.maxAmount===n.amount));
 for(let i=0;i<340;i++)tickWorld(w,.1);
 assert.equal(w.buildings.some(b=>b.team==='enemy'&&b.kind==='barracks'),false);
 assert.equal(w.units.some(u=>u.team==='enemy'&&u.kind==='soldier'),false);
 for(let i=0;i<30;i++)tickWorld(w,.1);
 const site=w.buildings.find(b=>b.team==='enemy'&&b.kind==='barracks');assert.ok(site&&!site.complete,'the barracks appears as a construction site');
 for(let i=0;i<250;i++)tickWorld(w,.1);
 assert.equal(site.complete,true);
});
test('enemy workers fund and construct barracks without passive income',()=>{
 const w=createWorld();w.units=w.units.filter(u=>u.team==='player');w.aiWorkerClock=-100000;
 const initial={...w.stock.enemy};
 for(let i=0;i<340;i++)tickWorld(w,.1);
 assert.deepEqual(w.stock.enemy,initial,'no enemy workers means no income');
 assert.equal(w.buildings.some(b=>b.team==='enemy'&&b.kind==='barracks'),false);
 const builder=makeUnit(w,'worker','enemy',w.enemyBarracksSite.x+90,w.enemyBarracksSite.y+80);
 builder.jobKind='wood';w.units.push(builder);
 for(let i=0;i<30;i++)tickWorld(w,.1);
 const site=w.buildings.find(b=>b.team==='enemy'&&b.kind==='barracks');
 assert.ok(site,'a worker starts the barracks');
 assert.equal(w.stock.enemy.stone,initial.stone-TYPES.barracks.cost.stone);
 const progress=site.progress;w.units=w.units.filter(u=>u!==builder);
 for(let i=0;i<250;i++)tickWorld(w,.1);
 assert.equal(site.progress,progress,'building stops without a builder');
});
test('archer trains at barracks and attacks from beyond guard range',()=>{
 const w=createWorld();w.aiClock=w.raidClock=-100000;
 w.progression.player.age=2;
 const b=makeBuilding(w,'barracks','player',700,370,true);w.buildings.push(b);
 const before={...w.stock.player};
 assert.equal(queueUnit(w,b.id,'archer').ok,true);
 assert.equal(w.stock.player.wood,before.wood-TYPES.archer.cost.wood);
 for(let i=0;i<150;i++)tickWorld(w,.1);
 const archer=w.units.find(u=>u.team==='player'&&u.kind==='archer');assert.ok(archer);
 const foe=makeUnit(w,'soldier','enemy',archer.x+100,archer.y);
 w.units.push(foe);const hp=foe.hp;
 for(let i=0;i<40;i++)tickWorld(w,.1);
 assert.ok(foe.hp<hp,'archer fires at range');
});
test('four barracks combat roles expose complete stats and modest counters',()=>{
 for(const kind of ['soldier','spearman','archer','cavalry']){
  const t=TYPES[kind];for(const field of ['hp','damage','armor','attackRange','attackSpeed','movementSpeed','populationCost','resourceCost'])assert.ok(t[field]!==undefined,kind+' '+field);
  const w=createWorld(),b=makeBuilding(w,'barracks','player',700,370,true);w.progression.player.age=2;w.buildings.push(b);
  assert.equal(queueUnit(w,b.id,kind).ok,true,kind+' can train');
 }
});
test('an archer arrow travels before dealing armored and counter damage',()=>{
 const w=createWorld();w.units=[];w.aiClock=w.raidClock=-100000;
 const a=makeUnit(w,'archer','player',900,400),target=makeUnit(w,'soldier','enemy',1000,400);
 w.units.push(a,target);tickWorld(w,.1);
 assert.equal(target.hp,target.maxHp,'damage waits for the arrow');
 assert.equal(w.projectiles.length,1);
 assert.ok(w.projectiles[0].x>a.x);
 for(let i=0;i<20;i++)tickWorld(w,.1);
 assert.ok(target.hp<target.maxHp);
 assert.ok(w.projectiles.every(p=>p.targetId!==target.id||p.travelled<p.maxDistance));
});
test('an isolated combat unit acquires another target after its first target dies',()=>{
 const w=createWorld();w.units=[];w.aiClock=w.raidClock=-100000;
 const a=makeUnit(w,'spearman','player',900,400),first=makeUnit(w,'cavalry','enemy',975,400),second=makeUnit(w,'archer','enemy',1020,430);
 w.units.push(a,first,second);for(let i=0;i<5;i++)tickWorld(w,.1);
 assert.equal(a.order?.target,first.id);
 first.hp=0;for(let i=0;i<5;i++)tickWorld(w,.1);
 assert.equal(a.order?.target,second.id);
});

test('armor and configured counters give a modest advantage in each matchup',()=>{
 const w=createWorld();
 for(const [attacker,defender] of [['spearman','cavalry'],['cavalry','archer'],['archer','soldier']]){
  const a=makeUnit(w,attacker,'player',800,400),d=makeUnit(w,defender,'enemy',850,400);
  assert.ok(combatDamage(a,d)>Math.max(1,TYPES[attacker].damage-TYPES[defender].armor));
  assert.ok(combatDamage(a,d)<=Math.round(TYPES[attacker].damage*1.3));
 }
});
test('arrows disappear when their target dies or their travel limit expires',()=>{
 const w=createWorld();w.units=[];w.aiClock=w.raidClock=-100000;
 const a=makeUnit(w,'archer','player',900,400),target=makeUnit(w,'soldier','enemy',1030,400);
 w.units.push(a,target);tickWorld(w,.1);assert.equal(w.projectiles.length,1);
 a.hp=0;target.x=1400;for(let i=0;i<12;i++)tickWorld(w,.1);
 assert.equal(w.projectiles.length,0);assert.equal(target.hp,target.maxHp);
});
test('enemy recruits workers, assigns gather jobs and respects housing capacity',()=>{
 const w=createWorld();w.buildings.find(b=>b.team==='player'&&b.kind==='town').hp=1e7;
 for(let i=0;i<1900;i++)tickWorld(w,.1);
 const workers=w.units.filter(u=>u.team==='enemy'&&u.kind==='worker');
 assert.ok(workers.length>=5,'enemy trains villagers beyond its starting three');
 assert.ok(w.nodes.some(n=>n.kind==='stone'&&n.amount<n.maxAmount),'an expansion worker mines stone for another barracks');
 assert.ok(w.buildings.some(b=>b.team==='enemy'&&b.kind==='house'&&b.complete));
 assert.equal(w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks').length,2,'stone and wood fund an expansion barracks');
 assert.ok(population(w,'enemy').used<=population(w,'enemy').max);
});
test('enemy waits for a squad of at least ten before attacking',()=>{
 const w=createWorld();w.aiClock=-100000;w.raidClock=1000;
 const e=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 for(let i=0;i<9;i++)w.units.push(makeUnit(w,'soldier','enemy',e.x-150+i%5*25,e.y-140+Math.floor(i/5)*25));
 tickWorld(w,.1);assert.equal(w.aiWavesSent,0);
 w.units.push(makeUnit(w,'archer','enemy',e.x-130,e.y-190));
 tickWorld(w,.1);
 assert.equal(w.aiWavesSent,1);
 assert.ok(w.units.filter(u=>u.raidWave).length>=10);
});
test('attack thresholds increase over time and raids use distinct bridge routes',()=>{
 const routes=[];
 for(const time of [140,350,900,1300]){
  const w=createWorld(),e=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
  w.time=time;w.aiClock=-100000;w.raidClock=1000;
  const size=time<300?10:time<620?14:time<1100?16:18;
  for(let i=0;i<size;i++)w.units.push(makeUnit(w,'soldier','enemy',e.x-200+i%5*26,e.y-200+Math.floor(i/5)*26));
  w.aiWavesSent=routes.length;
  tickWorld(w,.1);
  assert.equal(w.units.filter(u=>u.raidWave).length,size);
  const raider=w.units.find(u=>u.raidWave),bridge=AI.bridges[raider.raidBridge];
  const point={x:bridge[0]/1448*3000,y:bridge[1]/1086*2250};
  assert.ok(raider.path.some(p=>Math.hypot(p.x-point.x,p.y-point.y)<12),'planned path reaches a marked bridge');
  routes.push(raider.raidBridge);
 }
 assert.notEqual(routes[0],routes[1]);
});
test('base defenders intercept invaders without drafting villagers and then resume orders',()=>{
 const w=createWorld(),town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 const soldier=makeUnit(w,'soldier','enemy',town.x-140,town.y-90);
 const invader=makeUnit(w,'soldier','player',town.x+110,town.y+100);
 w.units.push(soldier,invader);w.aiClock=w.raidClock=-100000;
 const oldOrder={type:'attack',target:w.buildings.find(b=>b.team==='player'&&b.kind==='town').id};
 soldier.order=oldOrder;soldier.raidWave=true;
 tickWorld(w,.1);
 assert.equal(soldier.order?.target,invader.id);
 assert.ok(w.units.filter(u=>u.team==='enemy'&&u.kind==='worker').every(u=>u.order?.type!=='attack'));
 invader.hp=0;for(let i=0;i<180;i++)tickWorld(w,.1);
 assert.equal(soldier.order?.target,oldOrder.target);
});
test('enemy construction keeps resource deposits reachable as the base expands',()=>{
 const w=createWorld();w.buildings.find(b=>b.team==='player'&&b.kind==='town').hp=1e7;
 for(let i=0;i<2050;i++)tickWorld(w,.1);
 const deposits=w.nodes.filter(n=>n.amount>0&&n.x>2150&&n.kind==='food');
 for(const building of w.buildings.filter(b=>b.team==='enemy'&&b.kind!=='town'))for(const node of deposits){
  assert.ok(Math.hypot(node.x-building.x,node.y-building.y)>=TYPES[building.kind].radius+45,'building must not choke a food deposit');
 }
 const food=w.stock.enemy.food;
 w.aiClock=-100000;w.aiWorkerClock=-100000;
 for(let i=0;i<800;i++)tickWorld(w,.1);
 assert.ok(w.stock.enemy.food>food,'workers keep delivering after expansion');
});
test('enemy can rebuild and field sustained late mixed armies from mined resources',()=>{
 const w=createWorld();w.buildings.find(b=>b.team==='player'&&b.kind==='town').hp=1e8;
 const attacks=[];
 for(let i=0;i<17500&&!attacks.some(wave=>wave.length>=18);i++){
  tickWorld(w,.1);
  const raiders=w.units.filter(u=>u.team==='enemy'&&u.raidWave);
  if(raiders.length&&w.aiWavesSent>attacks.length){
   attacks.push(raiders.map(u=>u.kind));
   w.units=w.units.filter(u=>!u.raidWave);
  }
 }
 assert.deepEqual(attacks.slice(0,2).map(wave=>wave.length),[10,14]);
 assert.ok(attacks.some(wave=>wave.length>=18),'large waves become possible late in the game');
 assert.ok(new Set(attacks.find(wave=>wave.length>=18)).size>=3,'late waves use several military roles');
});
