import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,makeUnit} from '../js/world.js';
import {fogAt,updateVision,isEntityVisible} from '../js/fog.js';
import {minimapBounds,minimapToWorld,pointInMinimap} from '../js/minimap.js';
import {MAP,TYPES} from '../js/data.js';

test('fog has unexplored, visible and remembered territory without revealing enemy units',()=>{
 const w=createWorld(),enemy=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town');
 assert.equal(fogAt(w,enemy.x,enemy.y),0);
 const player=w.units.find(u=>u.team==='player'),scout=makeUnit(w,'archer','player',1200,900);
 w.units.push(scout);updateVision(w);
 assert.equal(fogAt(w,1200,900),2);
 const enemyScout=makeUnit(w,'soldier','enemy',1200,900);w.units.push(enemyScout);
 assert.equal(isEntityVisible(w,enemyScout),true);
 scout.x=2200;scout.y=1300;updateVision(w);
 assert.equal(fogAt(w,1200,900),1);
 assert.equal(isEntityVisible(w,enemyScout),false);
 assert.equal(isEntityVisible(w,player),true);
});
test('vision radii are configured for each unit and building',()=>{
 for(const kind of ['worker','soldier','spearman','archer','cavalry','town','house','barracks'])assert.ok(TYPES[kind].visionRadius>0,kind);
});
test('minimap clicks translate to bounded world camera coordinates',()=>{
 const c={width:900,height:600,x:500,y:500,zoom:1},r=minimapBounds(c);
 assert.ok(pointInMinimap(c,r.x+r.width/2,r.y+r.height/2));
 assert.ok(!pointInMinimap(c,r.x-4,r.y+10));
 const center=minimapToWorld(c,r.x+r.width/2,r.y+r.height/2);
 assert.ok(Math.abs(center.x-MAP.width/2)<1);
 assert.ok(Math.abs(center.y-MAP.height/2)<1);
 assert.equal(minimapToWorld(c,r.x-1,r.y+10),null);
});
test('restarting a game invalidates the cached fog image',async()=>{
 const {fogLayer}=await import('../js/render.js');
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>{
  const canvas={width:0,height:0,pixels:null};
  canvas.getContext=()=>({createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),putImageData:img=>{canvas.pixels=img.data}});
  return canvas;
 }};
 try{
  const first=createWorld();first.fog.explored[0]=1;first.fog.version++;
  assert.equal(fogLayer(first).pixels[3],190);
  const next=createWorld();next.fog.version=first.fog.version;
  assert.equal(fogLayer(next).pixels[3],255,'the new world starts unexplored');
 }finally{globalThis.document=oldDocument;}
});
