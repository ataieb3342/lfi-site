// Images are decoration only. Unit sizes, collisions and navigation stay in
// world.js and terrain.js, independent of the artwork and loading order.
const teams={player:'blue',enemy:'red'};
const kinds=['worker','soldier','spearman','archer','cavalry','champion','mythic','town','house','barracks','workshop'];
export const spriteAssets=Object.fromEntries(Object.entries(teams).map(([team,color])=>
 [team,Object.fromEntries(kinds.map(kind=>{
  const image=typeof Image==='undefined'?null:new Image();
  const art=kind==='champion'?'soldier':kind==='mythic'?'cavalry':kind;
  const src=`./assets/sprites/${color}-${art}.png`;
  if(image)image.src=src;
  return [kind,{src,image,columns:4,rows:['town','house','barracks','workshop'].includes(kind)?1:4}];
 }))]));

export function spriteFrame(unit,time){
 let row=0;
 if(unit.path?.length)row=1;
 else if(unit.order?.type==='attack'||unit.order?.type==='gather'||unit.order?.type==='build')
  row=unit.kind==='worker'&&unit.order.type==='build'?3:2;
 const count=4;
 const column=Math.floor(Math.max(0,time)*((row===1)?6:row>=2?5:2)+unit.id*.83)%count;
 return {row,column};
}

export function drawUnitSprite(ctx,unit,time){
 const asset=spriteAssets[unit.team]?.[unit.kind],image=asset?.image;
 if(!image?.complete||!image.naturalWidth)return false;
 const {row,column}=spriteFrame(unit,time),frameWidth=image.naturalWidth/4,frameHeight=image.naturalHeight/asset.rows;
 const width=unit.kind==='cavalry'||unit.kind==='mythic'?55:unit.kind==='champion'?46:unit.kind==='worker'?35:39;
 const height=unit.kind==='cavalry'||unit.kind==='mythic'?50:unit.kind==='champion'?47:unit.kind==='spearman'?46:41;
 const facing=unit.path?.length?unit.path[0].x-unit.x:unit.facing||1;
 ctx.save();if(unit.kind==='mythic'||unit.kind==='champion'){ctx.shadowColor=unit.kind==='mythic'?'#b663ff':'#f5d177';ctx.shadowBlur=10;}if(facing<-.5)ctx.scale(-1,1);
 ctx.drawImage(image,column*frameWidth,Math.min(row,asset.rows-1)*frameHeight,
  frameWidth,frameHeight,-width/2,-height+11,width,height);
 ctx.restore();return true;
}

export function drawBuildingSprite(ctx,building,radius){
 const image=spriteAssets[building.team]?.[building.kind]?.image;
 if(!image?.complete||!image.naturalWidth)return false;
 const width=radius*2.45,height=width*image.naturalHeight/image.naturalWidth;
 ctx.save();if(!building.complete)ctx.globalAlpha=.65;
 ctx.drawImage(image,-width/2,-height+radius*.57,width,height);
 ctx.restore();return true;
}
