import {MAP,TYPES,AI_DIFFICULTIES} from './data.js';
import {terrainBlocked,terrainBuildable,terrainSpeed} from './terrain.js';
import {createFog,updateVision} from './fog.js';
import {statValue} from './progression.js';
export function makeUnit(w,kind,team,x,y){const hp=Math.round(statValue(w,team,kind,'hp'));return {id:w.nextId++,type:'unit',kind,team,x,y,hp,maxHp:hp,order:null,path:[],carry:0,carryKind:null,work:0,cooldown:0};}
export function makeBuilding(w,kind,team,x,y,complete=true){return {id:w.nextId++,type:'building',kind,team,x,y,hp:complete?TYPES[kind].hp:Math.ceil(TYPES[kind].hp*.25),maxHp:TYPES[kind].hp,complete,progress:complete?TYPES[kind].time:0,queue:[],spawnProgress:0,research:null};}
export function getEntity(w,id){return w.units.find(u=>u.id===id)||w.buildings.find(b=>b.id===id)||w.nodes.find(n=>n.id===id);}
export const unitRadius=u=>u.kind==='mythic'?19:u.kind==='cavalry'?16:u.kind==='champion'?14:u.kind==='soldier'||u.kind==='spearman'?12:u.kind==='archer'?11:10;
export function unitSpotFree(w,u,x,y){return isWalkable(w,x,y,unitRadius(u))&&!w.units.some(other=>other!==u&&other.hp>0&&Math.hypot(other.x-x,other.y-y)<unitRadius(u)+unitRadius(other));}
export function isWalkable(w,x,y,margin=13){return x>=margin&&y>=margin&&x<=MAP.width-margin&&y<=MAP.height-margin&&!terrainBlocked(x,y,MAP.width,MAP.height)&&!w.buildings.some(b=>b.hp>0&&Math.hypot(x-b.x,y-b.y)<TYPES[b.kind].radius+margin+5);}
export function canBuild(w,x,y,radius,protectResources=false){
 if(!isWalkable(w,x,y,radius))return false;
 if(w.units.some(u=>u.hp>0&&Math.hypot(u.x-x,u.y-y)<radius+unitRadius(u)+5))return false;
 if(protectResources&&w.nodes.some(n=>n.amount>0&&Math.hypot(n.x-x,n.y-y)<radius+55))return false;
 for(let yy=y-radius;yy<=y+radius;yy+=10)for(let xx=x-radius;xx<=x+radius;xx+=10)
  if(Math.hypot(xx-x,yy-y)<=radius+3&&!terrainBuildable(xx,yy,MAP.width,MAP.height))return false;
 return terrainBuildable(x,y,MAP.width,MAP.height);
}
const mapPoint=(x,y)=>({x:Math.round(x*MAP.width/1448),y:Math.round(y*MAP.height/1086)});
export function createWorld(difficulty='normal'){
 const w={difficulty:AI_DIFFICULTIES[difficulty]?difficulty:'normal',nextId:1,time:0,units:[],buildings:[],nodes:[],projectiles:[],progression:{player:{age:1,techs:[],readyAt:{}},enemy:{age:1,techs:[],readyAt:{}}},stock:{player:{food:350,wood:260,gold:240,stone:90},enemy:{food:260,wood:160,gold:165,stone:65}},aiClock:0,raidClock:0,aiWaveActive:false,aiWavesSent:0,outcome:'playing',map:MAP};
 const player=mapPoint(230,205),enemy=mapPoint(1250,880),enemyBarracks=mapPoint(1160,885);
 w.enemyBarracksSite=enemyBarracks;
 w.buildings.push(makeBuilding(w,'town','player',player.x,player.y),makeBuilding(w,'town','enemy',enemy.x,enemy.y));
 for(const [x,y] of [[165,230],[235,265],[295,225]]){const p=mapPoint(x,y);w.units.push(makeUnit(w,'worker','player',p.x,p.y));}
 const spots={
  wood:[[70,280],[135,690],[1080,195],[1140,950],[500,315],[830,710],[1250,350]],
  food:[[110,205],[325,185],[1200,945],[1330,905],[675,365],[870,635]],
  gold:[[110,70],[150,630],[1010,700],[1370,975]],
  stone:[[300,95],[780,95],[350,855],[1330,790]]
 };
 for(const [kind,coords] of Object.entries(spots))for(const [x,y] of coords){const p=mapPoint(x,y),amount={wood:1400,food:2000,gold:1400,stone:900}[kind];w.nodes.push({id:w.nextId++,type:'node',kind,x:p.x,y:p.y,amount,maxAmount:amount});}
 for(const [kind,x,y] of [['food',1200,930],['gold',1330,905],['wood',1170,890]]){
  const p=mapPoint(x,y),u=makeUnit(w,'worker','enemy',p.x,p.y);u.jobKind=kind;w.units.push(u);
 }
 w.fog=createFog(MAP);updateVision(w);
 return w;
}
export function findPath(w,from,to,mover=null){
 const step=MAP.cell,cols=Math.ceil(MAP.width/step),rows=Math.ceil(MAP.height/step),size=cols*rows;
 const cell=p=>[Math.max(0,Math.min(cols-1,Math.floor(p.x/step))),Math.max(0,Math.min(rows-1,Math.floor(p.y/step)))];
 const [sx,sy]=cell(from),[gx,gy]=cell(to),start=sy*cols+sx;
 const costs=new Float64Array(size).fill(Infinity),prev=new Int32Array(size).fill(-1),closed=new Uint8Array(size),heap=[];
 const push=(id,score)=>{let i=heap.length;heap.push({id,score});while(i>0){const parent=(i-1)>>1;if(heap[parent].score<=score)break;heap[i]=heap[parent];i=parent;}heap[i]={id,score};};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=last.score)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
 costs[start]=0;push(start,0);let target=-1;
 while(heap.length){const {id}=pop();if(closed[id])continue;closed[id]=1;
  const x=id%cols,y=Math.floor(id/cols);
  if(Math.abs(x-gx)+Math.abs(y-gy)<=1){target=id;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
   const nk=ny*cols+nx,px=(nx+.5)*step,py=(ny+.5)*step;
   if(closed[nk]||!isWalkable(w,px,py,10))continue;
   let clear=true;
   if(dx&&dy&&(!isWalkable(w,(x+dx+.5)*step,(y+.5)*step,10)||!isWalkable(w,(x+.5)*step,(y+dy+.5)*step,10)))continue;
   for(let t=.2;t<1;t+=.2)if(!isWalkable(w,(x+.5+dx*t)*step,(y+.5+dy*t)*step,10)){clear=false;break;}
   if(!clear)continue;
   const crowded=mover&&w.units.some(other=>other!==mover&&other.hp>0&&Math.hypot(other.x-px,other.y-py)<unitRadius(mover)+unitRadius(other)+12);
   const cost=costs[id]+Math.hypot(dx,dy)/terrainSpeed(px,py,MAP.width,MAP.height)+(crowded?8:0);
   if(cost>=costs[nk])continue;costs[nk]=cost;prev[nk]=id;
   push(nk,cost+Math.hypot(nx-gx,ny-gy));
  }
 }
 if(target<0)return [];
 const path=[];for(let k=target;k!==start&&k>=0;k=prev[k])path.push({x:((k%cols)+.5)*step,y:(Math.floor(k/cols)+.5)*step});path.reverse();
 if(isWalkable(w,to.x,to.y,5))path.push({x:to.x,y:to.y});
 // Keep the grid for safe route planning, then remove visible intermediate
 // waypoints so units travel at any angle while retaining forest costs.
 const travel=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y)/terrainSpeed(b.x,b.y,MAP.width,MAP.height);
 const visible=(a,b)=>{
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance>240)return false;
  for(let d=8;d<distance+8;d+=8){
   const t=Math.min(1,d/distance),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   if(!isWalkable(w,x,y,10))return false;
   if(mover&&w.units.some(other=>other!==mover&&other.hp>0&&Math.hypot(other.x-x,other.y-y)<unitRadius(mover)+unitRadius(other)+5))return false;
  }
  return true;
 };
 const smooth=[],points=[from,...path];
 for(let i=0;i<points.length-1;){
  let best=i+1,oldCost=0;
  for(let j=i+1;j<points.length;j++){
   oldCost+=travel(points[j-1],points[j]);
   if(j>i+1&&visible(points[i],points[j])){
    let directCost=0,distance=Math.hypot(points[j].x-points[i].x,points[j].y-points[i].y);
    for(let d=12;d<=distance+12;d+=12){const t=Math.min(1,d/distance);directCost+=Math.min(12,distance-(d-12))/terrainSpeed(points[i].x+(points[j].x-points[i].x)*t,points[i].y+(points[j].y-points[i].y)*t,MAP.width,MAP.height);}
    if(directCost<=oldCost*1.08)best=j;
   }
   if(Math.hypot(points[j].x-points[i].x,points[j].y-points[i].y)>240)break;
  }
  smooth.push(points[best]);i=best;
 }
 return smooth;
}
