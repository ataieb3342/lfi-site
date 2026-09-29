import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync,readFileSync} from 'node:fs';
import {spriteFrame, spriteAssets} from '../js/sprites.js';

test('both factions have local sprite atlases for every unit and building',()=>{
 for(const team of ['player','enemy'])for(const kind of ['worker','soldier','spearman','archer','cavalry','town','house','barracks']){
  const asset=spriteAssets[team][kind];
  assert.ok(asset?.src?.startsWith('./assets/sprites/'),`${team} ${kind}`);
  assert.ok(statSync(new URL(`../${asset.src.slice(2)}`,import.meta.url)).size>1000);
 }
});
test('walking, attack, gathering and building choose the correct sprite rows',()=>{
 const unit={kind:'worker',order:null,path:[],cooldown:0,work:0};
 assert.equal(spriteFrame(unit,0).row,0);
 unit.path=[{x:1,y:1}];assert.equal(spriteFrame(unit,0).row,1);
 unit.path=[];unit.order={type:'gather'};assert.equal(spriteFrame(unit,0).row,2);
 unit.order={type:'build'};assert.equal(spriteFrame(unit,0).row,3);
 const archer={kind:'archer',order:{type:'attack'},path:[],cooldown:0.5};
 assert.equal(spriteFrame(archer,0).row,2);
 archer.path=[{x:1,y:1}];assert.equal(spriteFrame(archer,0).row,1);
});
test('loaded artwork is painted from the correct faction and pose',async()=>{
 const previous=globalThis.Image;
 globalThis.Image=class{complete=true;naturalWidth=512;naturalHeight=432;set src(value){this._src=value;if(value.includes('red-archer'))this.naturalHeight=576;}get src(){return this._src;}};
 try{
  const {drawUnitSprite,drawBuildingSprite}=await import('../js/sprites.js?loaded-test');
  const images=[],ctx={save(){},restore(){},scale(){},drawImage(...args){images.push(args);}};
  assert.equal(drawUnitSprite(ctx,{team:'enemy',kind:'archer',id:2,x:0,path:[],order:{type:'attack'},cooldown:0},1),true);
  assert.match(images[0][0].src,/red-archer\.png$/);
  assert.equal(images[0][2],2*144,'archer uses attack row');
 assert.equal(drawBuildingSprite(ctx,{team:'player',kind:'town',complete:true},55),true);
 assert.match(images[1][0].src,/blue-town\.png$/);
 }finally{if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;}
});
test('new red sheets provide four animation frames and worker construction poses',()=>{
 for(const kind of ['worker','soldier','spearman','archer','cavalry']){
  assert.ok(statSync(new URL(`../assets/sprite-sources/red-${kind}.png`,import.meta.url)).size>100000);
  assert.equal(spriteAssets.enemy[kind].columns,4);
 }
 assert.equal(spriteAssets.enemy.worker.rows,4);
 assert.equal(spriteFrame({id:0,team:'enemy',kind:'cavalry',path:[],order:null},1.6).column,3);
});
test('all five blue units use transparent individual sheets with four rows',()=>{
 for(const kind of ['worker','soldier','spearman','archer','cavalry']){
  const source=readFileSync(new URL(`../assets/sprite-sources/blue-${kind}.png`,import.meta.url));
  assert.equal(source.readUInt32BE(16),1254,kind);
  assert.equal(source.readUInt32BE(20),1254,kind);
  assert.equal(spriteAssets.player[kind].rows,4,kind);
  const atlas=readFileSync(new URL(`../assets/sprites/blue-${kind}.png`,import.meta.url));
  assert.equal(atlas.readUInt32BE(20),576,kind);
 }
});
