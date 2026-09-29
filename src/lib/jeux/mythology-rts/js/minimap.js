import {MAP} from './data.js';
export function minimapBounds(camera){
 const width=Math.min(160,Math.max(105,camera.width*.24)),height=width*MAP.height/MAP.width;
 return {x:camera.width-width-16,y:camera.height-height-16,width,height};
}
export function pointInMinimap(camera,x,y){
 const r=minimapBounds(camera);
 return x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;
}
export function minimapToWorld(camera,x,y){
 if(!pointInMinimap(camera,x,y))return null;
 const r=minimapBounds(camera);
 return {x:Math.max(0,Math.min(MAP.width,(x-r.x)/r.width*MAP.width)),y:Math.max(0,Math.min(MAP.height,(y-r.y)/r.height*MAP.height))};
}
