import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,makeUnit,isWalkable,unitRadius} from '../js/world.js';
import {orderMove,tickWorld} from '../js/game.js';

test('compact and line orders reserve distinct reachable destinations',()=>{
 for(const formation of ['compact','line']){
  const w=createWorld();w.aiClock=w.raidClock=w.aiWorkerClock=-100000;
  const group=Array.from({length:10},(_,i)=>makeUnit(w,'worker','player',700+i%5*26,370+Math.floor(i/5)*27));w.units.push(...group);
  assert.equal(orderMove(w,group.map(u=>u.id),1100,600,formation).ok,true);
  const slots=group.map(u=>u.order&&{x:u.order.x,y:u.order.y});
  assert.ok(slots.every(Boolean));
  for(let i=0;i<slots.length;i++){
   assert.ok(isWalkable(w,slots[i].x,slots[i].y,unitRadius(group[i])));
   for(let j=i+1;j<slots.length;j++)assert.ok(Math.hypot(slots[i].x-slots[j].x,slots[i].y-slots[j].y)>unitRadius(group[i])+unitRadius(group[j]));
  }
  const width=Math.max(...slots.map(s=>s.y))-Math.min(...slots.map(s=>s.y));
  if(formation==='line')assert.ok(width>145,'line spreads across the direction of travel');
  else assert.ok(width<145,'compact formation stays clustered');
 }
});
test('large group crosses a marked bridge without piling onto one point',()=>{
 const w=createWorld();w.aiClock=w.raidClock=w.aiWorkerClock=-100000;
 const start={x:2460,y:1670},goal={x:2060,y:1510};
 const group=Array.from({length:16},(_,i)=>makeUnit(w,'soldier','player',start.x+i%4*27,start.y+Math.floor(i/4)*27));w.units.push(...group);
 assert.equal(orderMove(w,group.map(u=>u.id),goal.x,goal.y,'compact').ok,true);
 for(let i=0;i<800;i++)tickWorld(w,.05);
 assert.ok(group.filter(u=>Math.hypot(u.x-goal.x,u.y-goal.y)<190).length>=14,'most units complete the crossing');
 for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)assert.ok(Math.hypot(group[i].x-group[j].x,group[i].y-group[j].y)>21,'no overlap');
});
test('shift toggles units, double click selects same type in view and drag selects a rectangle',async()=>{
 const {toggleSelection,selectSimilarVisible,selectRectangle}=await import('../js/selection.js');
 const w=createWorld(),c={x:550,y:500,zoom:1,width:1000,height:800};
 const first=w.units.find(u=>u.team==='player'),others=w.units.filter(u=>u.team==='player');
 const distant=makeUnit(w,'worker','player',2800,1800);w.units.push(distant);
 assert.deepEqual(toggleSelection([first.id],others[1].id),[first.id,others[1].id]);
 assert.deepEqual(toggleSelection([first.id,others[1].id],first.id),[others[1].id]);
 const similar=selectSimilarVisible(w,c,first.kind);
 assert.ok(similar.includes(first.id)&&similar.includes(others[1].id));
 assert.ok(!similar.includes(distant.id));
 const rect=selectRectangle(w,c,{x:0,y:0,toX:600,toY:600});
 assert.ok(rect.includes(first.id));assert.ok(!rect.includes(distant.id));
});
test('control groups retain a snapshot and ignore dead or enemy units',async()=>{
 const {storeControlGroup,recallControlGroup}=await import('../js/selection.js');
 const w=createWorld(),groups={};const ours=w.units.filter(u=>u.team==='player');
 storeControlGroup(groups,1,ours.map(u=>u.id),w);
 assert.deepEqual(recallControlGroup(groups,1,w),ours.map(u=>u.id));
 w.units=w.units.filter(u=>u!==ours[1]);
 assert.deepEqual(recallControlGroup(groups,1,w),[ours[0].id,ours[2].id]);
 assert.deepEqual(recallControlGroup(groups,2,w),[]);
});
test('context interaction deposits carried resources at an allied sanctuary',async()=>{
 const {orderInteract}=await import('../js/game.js');
 const w=createWorld(),worker=w.units.find(u=>u.team==='player'&&u.kind==='worker'),town=w.buildings.find(b=>b.team==='player'&&b.kind==='town');
 worker.carry=8;worker.carryKind='wood';worker.x=town.x+80;worker.y=town.y;
 const wood=w.stock.player.wood;
 assert.equal(orderInteract(w,[worker.id],town.id).ok,true);
 for(let i=0;i<200;i++)tickWorld(w,.1);
 assert.equal(w.stock.player.wood,wood+8);
 assert.equal(worker.carry,0);
});
