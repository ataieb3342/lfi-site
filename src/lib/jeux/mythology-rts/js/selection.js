import {worldToScreen} from './camera.js';
export function toggleSelection(ids,id){return ids.includes(id)?ids.filter(value=>value!==id):[...ids,id];}
export function selectSimilarVisible(w,c,kind){
 return w.units.filter(u=>u.team==='player'&&u.hp>0&&u.kind===kind).filter(u=>{
  const s=worldToScreen(c,u.x,u.y);
  return s.x>=0&&s.y>=0&&s.x<=c.width&&s.y<=c.height;
 }).map(u=>u.id);
}
export function selectRectangle(w,c,rect){
 const left=Math.min(rect.x,rect.toX),right=Math.max(rect.x,rect.toX),top=Math.min(rect.y,rect.toY),bottom=Math.max(rect.y,rect.toY);
 return w.units.filter(u=>u.team==='player'&&u.hp>0).filter(u=>{
  const s=worldToScreen(c,u.x,u.y);
  return s.x>=left&&s.x<=right&&s.y>=top&&s.y<=bottom;
 }).map(u=>u.id);
}
export function storeControlGroup(groups,index,ids,w){
 groups[index]=[...new Set(ids.filter(id=>w.units.some(u=>u.id===id&&u.team==='player'&&u.hp>0)))];
 return groups[index];
}
export function recallControlGroup(groups,index,w){
 return (groups[index]||[]).filter(id=>w.units.some(u=>u.id===id&&u.team==='player'&&u.hp>0));
}
