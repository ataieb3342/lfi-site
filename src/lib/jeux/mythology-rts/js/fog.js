import {MAP,TYPES} from './data.js';

export function createFog(map=MAP){
 const cell=40,cols=Math.ceil(map.width/cell),rows=Math.ceil(map.height/cell);
 return {cell,cols,rows,visible:new Uint8Array(cols*rows),explored:new Uint8Array(cols*rows),version:0};
}
export function updateVision(w){
 const fog=w.fog||(w.fog=createFog(w.map));
 const next=new Uint8Array(fog.visible.length),{cell,cols,rows}=fog;
 for(const entity of [...w.units,...w.buildings]){
  if(entity.team!=='player'||entity.hp<=0)continue;
  const radius=TYPES[entity.kind].visionRadius;
  if(!radius)continue;
  const minX=Math.max(0,Math.floor((entity.x-radius)/cell)),maxX=Math.min(cols-1,Math.floor((entity.x+radius)/cell));
  const minY=Math.max(0,Math.floor((entity.y-radius)/cell)),maxY=Math.min(rows-1,Math.floor((entity.y+radius)/cell));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const dx=(x+.5)*cell-entity.x,dy=(y+.5)*cell-entity.y;
   if(dx*dx+dy*dy<=radius*radius)next[y*cols+x]=1;
  }
 }
 let changed=false;
 for(let i=0;i<next.length;i++){
  if(next[i]!==fog.visible[i])changed=true;
  if(next[i]&&!fog.explored[i]){fog.explored[i]=1;changed=true;}
 }
 fog.visible=next;
 if(changed)fog.version++;
 return fog;
}
export function fogAt(w,x,y){
 const fog=w.fog;
 if(!fog||x<0||y<0||x>=w.map.width||y>=w.map.height)return 0;
 const col=Math.floor(x/fog.cell),row=Math.floor(y/fog.cell),index=row*fog.cols+col;
 return fog.visible[index]?2:fog.explored[index]?1:0;
}
export function isEntityVisible(w,entity){
 return entity.team==='player'||fogAt(w,entity.x,entity.y)===2;
}
