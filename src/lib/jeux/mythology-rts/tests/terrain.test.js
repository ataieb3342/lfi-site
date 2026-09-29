import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorld,isWalkable,findPath,canBuild,makeUnit} from '../js/world.js';
import {startConstruction,orderGather,tickWorld} from '../js/game.js';
import {terrainAt,terrainSpeed} from '../js/terrain.js';
import {MAP,TYPES} from '../js/data.js';

test('reference map defines two safe starts and a contested middle',()=>{
 const w=createWorld(),player=w.buildings.find(b=>b.team==='player'&&b.kind==='town'),enemy=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 assert.ok(player.x<MAP.width*.3&&player.y<MAP.height*.4);
 assert.ok(enemy.x>MAP.width*.7&&enemy.y>MAP.height*.6);
 assert.ok(w.nodes.some(n=>n.kind==='stone'&&n.x<MAP.width*.3));
 assert.ok(w.nodes.some(n=>n.kind==='stone'&&n.x>MAP.width*.7));
 assert.ok(w.nodes.some(n=>n.kind==='gold'&&Math.abs(n.x-MAP.width/2)<MAP.width*.25));
});
test('stone is stocked, harvested and spent on a barracks',()=>{
 const w=createWorld(),worker=w.units[0],stone=w.nodes.find(n=>n.kind==='stone');assert.ok(stone);assert.ok('stone' in w.stock.player);assert.ok(TYPES.barracks.cost.stone>0);
 const stock=w.stock.player.stone;worker.x=stone.x+15;worker.y=stone.y+15;stone.amount=2;
 assert.equal(orderGather(w,[worker.id],stone.id).ok,true);
 for(let i=0;i<750;i++)tickWorld(w,.1);
 assert.equal(w.stock.player.stone,stock+2);
 const spot={x:playerSite().x,y:playerSite().y};const cost=TYPES.barracks.cost.stone;
 assert.equal(startConstruction(w,[worker.id],'barracks',spot.x,spot.y).ok,true);
 assert.equal(w.stock.player.stone,stock+2-cost);
});
function playerSite(){return{x:700,y:370};}
test('blue and gray areas block travel while green slows and marked bridges stay open',()=>{
 const w=createWorld(),point=(x,y)=>({x:x/1448*MAP.width,y:y/1086*MAP.height});
 for(const [x,y,kind] of [[0,400,'#'],[250,515,'#'],[765,850,'#'],[350,855,'X'],[550,350,'g']]){
  const p=point(x,y);assert.equal(terrainAt(p.x,p.y,MAP.width,MAP.height),kind);
  assert.equal(isWalkable(w,p.x,p.y,5),kind==='g');assert.equal(canBuild(w,p.x,p.y,20),false);
 }
 assert.equal(terrainSpeed(...Object.values(point(550,350)),MAP.width,MAP.height),.5);
 const player=w.buildings.find(b=>b.team==='player'&&b.kind==='town'),enemy=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 const route=findPath(w,{x:player.x+100,y:player.y},{x:enemy.x-100,y:enemy.y});assert.ok(route.length>8);
 for(const [bx,by] of [[355,555],[1090,410],[1090,760]]){const p=point(bx,by);assert.equal(isWalkable(w,p.x,p.y,5),true,'marked crossing remains open');}
 assert.ok(route.every(p=>isWalkable(w,p.x,p.y,5)));
});
test('terrain data has consistent rows and forest only halves movement',()=>{
 const w=createWorld(),p={x:550/1448*MAP.width,y:350/1086*MAP.height};
 const u=makeUnit(w,'worker','player',p.x,p.y);w.units.push(u);u.order={type:'move',x:p.x+30,y:p.y};u.path=[{x:p.x+30,y:p.y}];
 tickWorld(w,.1);assert.ok(Math.abs(u.x-p.x-4.4)<.2,'forest movement is half normal speed');
 assert.equal(canBuild(w,700,370,45),true);
});
test('offline entry includes unannotated background map',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const renderer=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');assert.match(html,/game-standalone\.js/);assert.match(renderer,/assets\/battlefield\.png/);assert.ok(readFileSync(new URL('../assets/battlefield.png',import.meta.url)).length>100000);
});
test('HUD displays stone alongside other resources',()=>{const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');assert.match(main,/stock\.stone/);assert.match(main,/Pierre/);});
test('northern expansion is reachable through the upper bridge',()=>{const w=createWorld(),north=w.nodes.find(n=>n.kind==='stone'&&n.y<300&&n.x>MAP.width/2),start=w.buildings.find(b=>b.team==='player'&&b.kind==='town');assert.ok(north);const route=findPath(w,{x:start.x+90,y:start.y},{x:north.x,y:north.y});assert.ok(route.length>0,'northern stone expansion has a traversable approach');});
test('pathfinding can travel diagonally without crossing forbidden terrain',()=>{
 const w=createWorld(),route=findPath(w,{x:700,y:370},{x:830,y:490});
 assert.ok(route.length>0);
 assert.ok(route.some((p,i)=>Math.abs(p.x-(i?route[i-1].x:700))>20&&Math.abs(p.y-(i?route[i-1].y:370))>20),'route contains diagonal movement');
 for(const p of route)assert.equal(isWalkable(w,p.x,p.y,5),true);
 let previous={x:700,y:370};
 for(const p of route){const distance=Math.hypot(p.x-previous.x,p.y-previous.y);for(let d=8;d<distance;d+=8){const t=d/distance;assert.equal(isWalkable(w,previous.x+(p.x-previous.x)*t,previous.y+(p.y-previous.y)*t,5),true,'smoothed line stays outside obstacles');}previous=p;}
});
test('a clear route uses a free heading rather than a staircase of grid directions',()=>{
 const w=createWorld(),start={x:700,y:370},end={x:920,y:450},route=findPath(w,start,end);
 assert.ok(route.length>0);
 const dx=route[0].x-start.x,dy=route[0].y-start.y;
 assert.ok(Math.hypot(dx,dy)>85&&Math.abs(dx)>20&&Math.abs(dy)>8&&Math.abs(Math.abs(dx)-Math.abs(dy))>10,'first segment should skip grid points at an arbitrary angle');
});
