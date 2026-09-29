import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorld,makeUnit,makeBuilding} from '../js/world.js';
import {tickWorld} from '../js/game.js';
import {AI_DIFFICULTIES,TYPES} from '../js/data.js';

function firstRaid(difficulty){
 const w=createWorld(difficulty);
 w.buildings.find(b=>b.team==='player'&&b.kind==='town').hp=1e8;
 for(let i=0;i<4000;i++){
  tickWorld(w,.1);
  const raiders=w.units.filter(u=>u.team==='enemy'&&u.raidWave);
  if(raiders.length)return {time:w.time,raiders,w};
 }
 throw Error(`${difficulty} never attacks`);
}

test('default is normal and difficulty never changes stats, costs, or starting resources',()=>{
 assert.equal(createWorld().difficulty,'normal');
 assert.equal(createWorld('bad').difficulty,'normal');
 const initial=createWorld().stock.enemy;
 for(const difficulty of Object.keys(AI_DIFFICULTIES)){
  const w=createWorld(difficulty);
  assert.deepEqual(w.stock.enemy,initial);
  assert.equal(w.progression.enemy.age,1);
  assert.equal(TYPES.soldier.damage,17);
  assert.equal(TYPES.cavalry.resourceCost.gold,65);
  assert.equal(AI_DIFFICULTIES[difficulty].economicBonus,0);
 }
});

test('local entry offers all three choices and displays the active difficulty',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../js/game-standalone.js',import.meta.url),'utf8');
 for(const key of ['easy','normal','hard'])assert.match(html,new RegExp(`data-difficulty="${key}"`));
 assert.match(html,/id="start-menu"/);
 assert.match(html,/id="difficulty-status"/);
 assert.match(main,/createWorld\(difficulty\)/);
});

test('easy gives breathing room, normal fields ten, hard fields fourteen first and faster',()=>{
 const easy=firstRaid('easy'),normal=firstRaid('normal'),hard=firstRaid('hard');
 assert.ok(hard.time<normal.time&&normal.time<easy.time,`attack times ${hard.time}, ${normal.time}, ${easy.time}`);
 assert.equal(easy.raiders.length,6);
 assert.equal(normal.raiders.length,10);
 assert.equal(hard.raiders.length,14);
 assert.equal(new Set(easy.raiders.map(u=>u.raidBridge)).size,1);
 assert.equal(new Set(hard.raiders.map(u=>u.raidBridge)).size,2,'hard splits its offensive across bridges');
 assert.ok(easy.w.stock.enemy.food>=0&&hard.w.stock.enemy.food>=0);
});

test('hard remembers visible cavalry and gradually favors spearmen without map-wide knowledge',()=>{
 const w=createWorld('hard'),town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 w.time=50;w.aiClock=w.raidClock=-1e5;
 const cavalry=[0,1,2].map(i=>makeUnit(w,'cavalry','player',town.x-250+i*24,town.y-100));
 w.units.push(...cavalry);tickWorld(w,.1);
 assert.equal(w.aiCounterPreference,'spearman');
 assert.ok(w.aiCounterNext-w.time>20,'counter analysis is periodic');
 for(const u of cavalry){u.x=300;u.y=300;}
 tickWorld(w,.1);
 assert.equal(w.aiCounterPreference,'spearman','the response has inertia');
 const unseen=createWorld('hard');unseen.time=50;
 for(const u of cavalry)unseen.units.push(makeUnit(unseen,'cavalry','player',300,300));
 tickWorld(unseen,.1);
 assert.equal(unseen.aiCounterPreference,undefined,'distant, unobserved troops do not inform counters');
});

test('normal responds to a clearly observed cavalry group and keeps training with no resource bonus',()=>{
 const w=createWorld('normal'),town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 w.time=50;w.aiClock=w.raidClock=-1e5;
 for(let i=0;i<4;i++)w.units.push(makeUnit(w,'cavalry','player',town.x-250+i*20,town.y-100));
 tickWorld(w,.1);
 assert.equal(w.aiCounterPreference,'spearman');
 assert.ok(w.aiCounterNext-w.time>=29);
 assert.equal(AI_DIFFICULTIES.normal.economicBonus,0);
});

test('normal sends a third mixed wave before Age III rather than stalling for advancement',()=>{
 const w=createWorld('normal'),playerTown=w.buildings.find(b=>b.team==='player'&&b.kind==='town');
 playerTown.hp=1e8;
 const waves=[];
 for(let i=0;i<8200&&waves.length<3;i++){
  tickWorld(w,.1);
  const raiders=w.units.filter(u=>u.team==='enemy'&&u.raidWave);
  if(raiders.length&&w.aiWavesSent>waves.length){
   waves.push({time:w.time,kinds:raiders.map(u=>u.kind)});
   w.units=w.units.filter(u=>!u.raidWave);
  }
 }
 assert.deepEqual(waves.map(wave=>wave.kinds.length),[10,14,16]);
 assert.ok(waves[2].time<800,'the third offensive follows without an age-up stall');
 assert.ok(new Set(waves[2].kinds).size>=3);
});

test('hard rebuilds a lost second barracks using its workers and real stock',()=>{
 const w=createWorld('hard'),town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 w.time=300;w.aiClock=w.raidClock=-1e5;
 w.stock.enemy={food:600,wood:450,gold:300,stone:200};
 w.buildings.push(makeBuilding(w,'barracks','enemy',town.x-170,town.y-150));
 const stone=w.stock.enemy.stone;
 for(let i=0;i<40;i++)tickWorld(w,.1);
 assert.equal(w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks').length,2);
 assert.ok(w.stock.enemy.stone<stone,'rebuilding spends collected stone');
 assert.ok(w.units.some(u=>u.team==='enemy'&&u.kind==='worker'&&u.order?.type==='build'));
});
