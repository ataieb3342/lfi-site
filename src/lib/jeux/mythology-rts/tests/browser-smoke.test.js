import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function fakeContext(){
 const context={rectangles:[],strokeRect(...args){this.rectangles.push(args);},createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)})};
 return new Proxy(context,{get:(value,key)=>key in value?value[key]:()=>{}});
}
function fakeElement(){
 const listeners={},context=fakeContext();
 return {listeners,context,style:{},classList:{add(){},remove(){}},hidden:false,
  addEventListener:(event,fn)=>{listeners[event]=fn;},getContext:()=>context,
  getBoundingClientRect:()=>({left:0,top:0,width:1280,height:500}),
  replaceChildren(){},append(){},textContent:'',innerHTML:''};
}
test('offline bundle starts, draws fog and responds to selection and minimap input',()=>{
 const difficultyButtons=['easy','normal','hard'].map(difficulty=>({dataset:{difficulty}}));
 const html=new Map(),events={},document={
  querySelector:selector=>{if(!html.has(selector))html.set(selector,fakeElement());return html.get(selector);},
  querySelectorAll:selector=>selector==='[data-difficulty]'?difficultyButtons:[],
  createElement:()=>fakeElement()
 };
 let frame=null;
 const sandbox={document,window:{addEventListener:(name,handler)=>{events[name]=handler;}},devicePixelRatio:1,
  performance:{now:()=>0},requestAnimationFrame:callback=>{frame=callback;},Uint8Array,Uint8ClampedArray,Float64Array,Int32Array,Math,Map,Set,Number,Object,Array};
 const script=readFileSync(new URL('../js/game-standalone.js',import.meta.url),'utf8');
 runInNewContext(script,sandbox,{timeout:5000});
 difficultyButtons[1].onclick();
 assert.equal(typeof frame,'function');
 frame(16);
 const canvas=html.get('#game');
 const before=canvas.context.rectangles.at(-2)[0];
 const e=(x,y,extras={})=>({button:0,clientX:x,clientY:y,buttons:1,preventDefault(){},...extras});
 canvas.listeners.mousedown(e(490,230));events.mouseup(e(490,230));
 assert.ok(html.get('#selection').innerHTML.includes('Ouvrier'));
 events.keydown({key:'1',ctrlKey:true,repeat:false,preventDefault(){}});
 canvas.listeners.mousedown(e(880,320));events.mouseup(e(880,320));
 events.keydown({key:'1',ctrlKey:false,repeat:false,preventDefault(){}});
 assert.ok(html.get('#selection').innerHTML.includes('Ouvrier'));
 canvas.listeners.mousedown(e(1180,420));events.mouseup(e(1180,420));
 frame(32);
 assert.notEqual(canvas.context.rectangles.at(-2)[0],before,'the camera rectangle moves after a minimap click');
 assert.ok(html.get('#resources').innerHTML.includes('Population'));
});
