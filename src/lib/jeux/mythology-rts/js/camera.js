export function screenToWorld(camera,x,y){return{x:camera.x+(x-camera.width/2)/camera.zoom,y:camera.y+(y-camera.height/2)/camera.zoom};}
export function worldToScreen(camera,x,y){return{x:(x-camera.x)*camera.zoom+camera.width/2,y:(y-camera.y)*camera.zoom+camera.height/2};}
