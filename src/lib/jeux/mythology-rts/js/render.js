import {MAP,TYPES,LABELS} from './data.js';
import {worldToScreen} from './camera.js';
import {fogAt,isEntityVisible} from './fog.js';
import {minimapBounds} from './minimap.js';
import {drawBuildingSprite,drawUnitSprite} from './sprites.js';
const ground=['#304644','#354c47','#39534a','#314943'];
let fogCanvas=null,fogPaintedVersion=-1,fogPaintedWorld=null;
export function fogLayer(w){
 const fog=w.fog;if(!fog)return null;
 if(fogPaintedWorld!==fog){fogPaintedWorld=fog;fogPaintedVersion=-1;}
 if(!fogCanvas||fogCanvas.width!==fog.cols||fogCanvas.height!==fog.rows){
  fogCanvas=document.createElement('canvas');fogCanvas.width=fog.cols;fogCanvas.height=fog.rows;fogPaintedVersion=-1;
 }
 if(fogPaintedVersion!==fog.version){
  const layer=fogCanvas.getContext('2d'),pixels=layer.createImageData(fog.cols,fog.rows);
  for(let i=0;i<fog.visible.length;i++){
   const offset=i*4,visible=fog.visible[i],explored=fog.explored[i];
   pixels.data[offset]=6;pixels.data[offset+1]=16;pixels.data[offset+2]=27;
   pixels.data[offset+3]=visible?0:explored?190:255;
  }
  layer.putImageData(pixels,0,0);fogPaintedVersion=fog.version;
 }
 return fogCanvas;
}
function drawFog(ctx,w,c){
 const layer=fogLayer(w);if(!layer)return;
 const s=worldToScreen(c,0,0);ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(layer,s.x,s.y,layer.width*w.fog.cell*c.zoom,layer.height*w.fog.cell*c.zoom);ctx.restore();
}

const terrainImage=typeof Image==='undefined'?null:new Image();
if(terrainImage){
 const status=()=>document.querySelector('#map-status');
 terrainImage.onload=()=>{if(status())status().textContent='CARTE V0.16 · CHARGÉE';};
 terrainImage.onerror=()=>{if(status()){status().textContent='CARTE V0.16 · IMAGE MANQUANTE';status().style.color='#ff9b91';}};
 terrainImage.src='./assets/battlefield.png';
}
function drawTerrain(ctx,c){
 ctx.fillStyle='#253b3a';ctx.fillRect(0,0,c.width,c.height);
 if(!terrainImage?.complete||!terrainImage.naturalWidth)return false;
 const left=Math.max(0,c.x-c.width/2/c.zoom),top=Math.max(0,c.y-c.height/2/c.zoom);
 const right=Math.min(MAP.width,c.x+c.width/2/c.zoom),bottom=Math.min(MAP.height,c.y+c.height/2/c.zoom);
 if(right<=left||bottom<=top)return true;
 const a=worldToScreen(c,left,top);
 ctx.drawImage(terrainImage,left/MAP.width*terrainImage.naturalWidth,top/MAP.height*terrainImage.naturalHeight,(right-left)/MAP.width*terrainImage.naturalWidth,(bottom-top)/MAP.height*terrainImage.naturalHeight,a.x,a.y,(right-left)*c.zoom,(bottom-top)*c.zoom);
 return true;
}

export function draw(ctx,w,c,ui){const width=c.width,height=c.height;ctx.clearRect(0,0,width,height);const terrainReady=drawTerrain(ctx,c);const tl={x:c.x-width/2/c.zoom,y:c.y-height/2/c.zoom},tile=80;if(!terrainReady)for(let y=Math.floor(tl.y/tile)*tile;y<tl.y+height/c.zoom+tile;y+=tile)for(let x=Math.floor(tl.x/tile)*tile;x<tl.x+width/c.zoom+tile;x+=tile){if(x<0||y<0||x>=MAP.width||y>=MAP.height)continue;const s=worldToScreen(c,x,y);ctx.fillStyle=ground[(Math.abs(Math.floor(x/tile)*13+Math.floor(y/tile)*17))%ground.length];ctx.fillRect(s.x,s.y,tile*c.zoom+1,tile*c.zoom+1);ctx.fillStyle='#ffffff08';ctx.fillRect(s.x,s.y,1,tile*c.zoom);}const a=worldToScreen(c,0,0),b=worldToScreen(c,MAP.width,MAP.height);ctx.strokeStyle='#bb9459';ctx.lineWidth=5;ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
for(const n of w.nodes){if(n.amount<=0||fogAt(w,n.x,n.y)===0)continue;const s=worldToScreen(c,n.x,n.y);if(s.x< -70||s.y< -70||s.x>width+70||s.y>height+70)continue;const z=c.zoom;ctx.save();ctx.translate(s.x,s.y);ctx.scale(z,z);if(n.kind==='wood'){ctx.fillStyle='#644634';ctx.fillRect(-5,2,10,20);for(const [ox,oy,r] of [[0,-12,19],[-12,-5,14],[12,-5,14]]){ctx.fillStyle=r===19?'#507d55':'#38664e';ctx.beginPath();ctx.arc(ox,oy,r,0,7);ctx.fill();}}else if(n.kind==='food'){ctx.fillStyle='#56804d';ctx.beginPath();ctx.arc(0,1,18,0,7);ctx.fill();for(const [dx,dy] of [[-8,-8],[5,-4],[-2,8],[10,8]]){ctx.fillStyle='#bf5360';ctx.beginPath();ctx.arc(dx,dy,4,0,7);ctx.fill();}}else if(n.kind==='stone'){ctx.fillStyle='#c2bec0';ctx.beginPath();ctx.moveTo(-19,12);ctx.lineTo(-14,-6);ctx.lineTo(-3,-15);ctx.lineTo(14,-10);ctx.lineTo(21,13);ctx.closePath();ctx.fill();ctx.strokeStyle='#68747b';ctx.lineWidth=2;ctx.stroke();}else{ctx.fillStyle='#656f73';ctx.beginPath();ctx.moveTo(-20,15);ctx.lineTo(-12,-13);ctx.lineTo(5,-20);ctx.lineTo(22,12);ctx.closePath();ctx.fill();ctx.fillStyle='#efc571';ctx.beginPath();ctx.arc(2,-3,7,0,7);ctx.fill();}ctx.restore();}
for(const building of w.buildings){if(!isEntityVisible(w,building))continue;const s=worldToScreen(c,building.x,building.y),z=c.zoom,r=TYPES[building.kind].radius;if(s.x< -110||s.y< -110||s.x>width+110||s.y>height+110)continue;ctx.save();ctx.translate(s.x,s.y);ctx.scale(z,z);if(!drawBuildingSprite(ctx,building,r)){ctx.fillStyle='#07161977';ctx.beginPath();ctx.ellipse(5,15,r+8,r*.55,0,0,7);ctx.fill();ctx.fillStyle=building.complete?(building.team==='player'?'#cfb688':'#a67980'):'#796f60';ctx.fillRect(-r*.8,-r*.2,r*1.6,r*.95);ctx.fillStyle=building.team==='player'?'#876246':'#5e354c';ctx.beginPath();ctx.moveTo(-r-8,-r*.2);ctx.lineTo(0,-r*.95);ctx.lineTo(r+8,-r*.2);ctx.closePath();ctx.fill();ctx.fillStyle='#edd7a2';ctx.fillRect(-7,r*.25,14,r*.5);if(building.kind==='town'){ctx.fillStyle='#f2bb6d';ctx.fillRect(-8,-r*.98,16,-20);ctx.beginPath();ctx.arc(0,-r*.98-22,8,0,7);ctx.fill();}if(building.kind==='barracks'){ctx.strokeStyle='#eadaba';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-r*.4);ctx.lineTo(14,0);ctx.moveTo(14,-r*.4);ctx.lineTo(-14,0);ctx.stroke();}}ctx.restore();if(!building.complete)bar(ctx,s.x,s.y-r*z-14,r*1.5*z,building.progress/TYPES[building.kind].time,'#e2bf76');if(building.hp<building.maxHp)bar(ctx,s.x,s.y+r*z+10,r*1.6*z,building.hp/building.maxHp,'#9dc982');}
for(const u of w.units){if(!isEntityVisible(w,u))continue;const s=worldToScreen(c,u.x,u.y);if(s.x< -35||s.y< -35||s.x>width+35||s.y>height+35)continue;const z=c.zoom;ctx.save();ctx.translate(s.x,s.y);ctx.scale(z,z);if(!drawUnitSprite(ctx,u,w.time)){ctx.fillStyle='#07121b77';ctx.beginPath();ctx.ellipse(3,9,13,6,0,0,7);ctx.fill();ctx.fillStyle=u.team==='player'?'#c5e1d0':'#d6a6ab';ctx.beginPath();ctx.arc(0,0,u.kind==='cavalry'?15:u.kind==='soldier'||u.kind==='spearman'?11:9,0,7);ctx.fill();ctx.fillStyle=u.team==='player'?'#3a8490':'#a23e55';ctx.fillRect(-8,1,16,9);ctx.fillStyle=u.kind==='soldier'||u.kind==='spearman'?'#e0bd71':u.kind==='cavalry'?'#c9c3e9':'#665b47';ctx.fillRect(-4,-10,8,5);if(u.kind==='soldier'){ctx.strokeStyle='#e4d4ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,-5);ctx.lineTo(17,-17);ctx.stroke();}if(u.kind==='spearman'){ctx.strokeStyle='#e4d4ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,14);ctx.lineTo(18,-19);ctx.stroke();}if(u.kind==='cavalry'){ctx.fillStyle=u.team==='player'?'#94adb4':'#aa7c88';ctx.beginPath();ctx.ellipse(-1,9,15,6,0,0,7);ctx.fill();ctx.fillStyle='#eeddb6';ctx.fillRect(9,-12,5,14);}if(u.kind==='archer'){ctx.strokeStyle='#e9d9aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(13,-5,9,-1.3,1.3);ctx.stroke();ctx.beginPath();ctx.moveTo(15,-13);ctx.lineTo(15,3);ctx.stroke();}if(u.carry){ctx.fillStyle='#eadc7b';ctx.beginPath();ctx.arc(-12,6,5,0,7);ctx.fill();}}ctx.restore();if(u.hp<u.maxHp)bar(ctx,s.x,s.y-22*z,24*z,u.hp/u.maxHp,'#98cf80');}
for(const p of w.projectiles||[]){if(p.team==='enemy'&&fogAt(w,p.x,p.y)!==2)continue;const s=worldToScreen(c,p.x,p.y);if(s.x<0||s.y<0||s.x>width||s.y>height)continue;ctx.fillStyle=p.team==='player'?'#ffe29b':'#ff9e94';ctx.beginPath();ctx.arc(s.x,s.y,Math.max(2,3*c.zoom),0,Math.PI*2);ctx.fill();}
drawFog(ctx,w,c);
for(const id of ui.selected){const e=[...w.units,...w.buildings].find(e=>e.id===id);if(!e)continue;const s=worldToScreen(c,e.x,e.y);ctx.strokeStyle='#f8d480';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y+9*c.zoom,(e.type==='unit'?17:TYPES[e.kind].radius+8)*c.zoom,(e.type==='unit'?9:20)*c.zoom,0,0,7);ctx.stroke();}if(ui.drag){ctx.strokeStyle='#f5d489';ctx.fillStyle='#f5d48924';const x=Math.min(ui.drag.x,ui.drag.toX),y=Math.min(ui.drag.y,ui.drag.toY),rw=Math.abs(ui.drag.x-ui.drag.toX),rh=Math.abs(ui.drag.y-ui.drag.toY);ctx.fillRect(x,y,rw,rh);ctx.strokeRect(x,y,rw,rh);}if(ui.build){const s=worldToScreen(c,ui.mouse.x,ui.mouse.y);ctx.fillStyle='#e6d49088';ctx.beginPath();ctx.arc(s.x,s.y,TYPES[ui.build].radius*c.zoom,0,7);ctx.fill();}drawMinimap(ctx,w,c);}
function bar(ctx,x,y,width,ratio,color){ctx.fillStyle='#1a1820';ctx.fillRect(x-width/2,y,width,5);ctx.fillStyle=color;ctx.fillRect(x-width/2,y,Math.max(0,ratio)*width,5);}
function drawMinimap(ctx,w,c){
 const r=minimapBounds(c),{x,y,width,height}=r;
 ctx.fillStyle='#0e2536e8';ctx.fillRect(x-4,y-4,width+8,height+8);
 ctx.fillStyle='#354f48';ctx.fillRect(x,y,width,height);
 if(terrainImage?.complete&&terrainImage.naturalWidth)ctx.drawImage(terrainImage,x,y,width,height);
 const layer=fogLayer(w);if(layer){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,x,y,width,height);ctx.restore();}
 for(const b of w.buildings){
  if(!isEntityVisible(w,b))continue;
  ctx.fillStyle=b.team==='player'?'#ebd99b':'#e8758b';
  ctx.fillRect(x+b.x/MAP.width*width-2,y+b.y/MAP.height*height-2,5,5);
 }
 for(const u of w.units){
  if(!isEntityVisible(w,u))continue;
  ctx.fillStyle=u.team==='player'?'#77c4d0':'#ef8295';
  ctx.fillRect(x+u.x/MAP.width*width-1,y+u.y/MAP.height*height-1,3,3);
 }
 ctx.strokeStyle='#eee7c3';ctx.lineWidth=1.5;
 ctx.strokeRect(x+(c.x-c.width/2/c.zoom)/MAP.width*width,y+(c.y-c.height/2/c.zoom)/MAP.height*height,c.width/c.zoom/MAP.width*width,c.height/c.zoom/MAP.height*height);
 ctx.strokeStyle='#d6a75f';ctx.strokeRect(x,y,width,height);
}
