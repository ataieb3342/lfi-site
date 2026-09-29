/* Generated from js/*.js by tools/build-standalone.mjs. Edit the modules, then rebuild. */
(()=>{
'use strict';

// js/data.js
const MAP={width:3000,height:2250,cell:40,imageWidth:1448,imageHeight:1086};
// The soldier id remains for compatibility with existing games: it is the infantry role.
const COMBAT={counterMultiplier:1.2,counters:{spearman:'cavalry',cavalry:'archer',archer:'soldier'},projectileSpeed:250,projectileMaxDistance:190,acquisitionRadius:165};
const TYPES={
 worker:{hp:65,damage:4,armor:0,attackRange:22,attackSpeed:1.25,movementSpeed:88,populationCost:1,resourceCost:{food:55},visionRadius:205,time:7},
 soldier:{hp:140,damage:17,armor:3,attackRange:34,attackSpeed:.85,movementSpeed:90,populationCost:1,resourceCost:{food:65,gold:35},visionRadius:235,time:10},
 spearman:{hp:125,damage:14,armor:2,attackRange:42,attackSpeed:1.05,movementSpeed:86,populationCost:1,resourceCost:{food:60,wood:35},visionRadius:230,time:11},
 archer:{hp:75,damage:11,armor:0,attackRange:135,attackSpeed:1.3,movementSpeed:83,populationCost:1,resourceCost:{food:55,wood:35,gold:25},visionRadius:265,time:12},
 cavalry:{hp:175,damage:19,armor:2,attackRange:37,attackSpeed:1.1,movementSpeed:125,populationCost:2,resourceCost:{food:95,gold:65},visionRadius:300,time:17},
 champion:{hp:240,damage:27,armor:4,attackRange:42,attackSpeed:1.1,movementSpeed:86,populationCost:2,resourceCost:{food:120,gold:105,stone:25},visionRadius:240,time:21},
 mythic:{hp:350,damage:33,armor:5,attackRange:48,attackSpeed:1.4,movementSpeed:103,populationCost:4,resourceCost:{food:175,gold:145,stone:80},visionRadius:320,time:33},
 town:{hp:1150,radius:55,cost:{wood:300},visionRadius:360,time:30,pop:8},house:{hp:260,radius:33,cost:{wood:65},visionRadius:180,time:8,pop:5},barracks:{hp:580,radius:45,cost:{wood:120,gold:55,stone:50},visionRadius:220,time:16,pop:0},
 workshop:{hp:420,radius:39,cost:{wood:110,gold:70,stone:35},visionRadius:215,time:18,pop:0}
};
for(const kind of ['worker','soldier','spearman','archer','cavalry','champion','mythic']){
 const t=TYPES[kind];t.range=t.attackRange;t.attackTime=t.attackSpeed;t.speed=t.movementSpeed;t.pop=t.populationCost;t.cost=t.resourceCost;
}
const LABELS={worker:'Ouvrier',soldier:'Fantassin',spearman:'Lancier',archer:'Archer',cavalry:'Cavalier',champion:'Champion',mythic:'Gardien mythique',town:'Sanctuaire',house:'Maison',barracks:'Caserne',workshop:'Atelier',wood:'Bois',food:'Nourriture',gold:'Or',stone:'Pierre'};

const AGES={
 1:{label:'Âge I',cost:{},time:0},
 2:{label:'Âge II',cost:{food:280,wood:190,gold:170},time:25},
 3:{label:'Âge III',cost:{food:480,wood:300,gold:310,stone:120},time:42}
};
const UNLOCK_AGE={worker:1,house:1,barracks:1,soldier:1,spearman:1,
 archer:2,cavalry:2,workshop:2,champion:3,mythic:3};
// A single registry drives costs, prerequisites, durations and stat changes.
const TECHNOLOGIES={
 forgedBlades:{label:'Lames forgées',age:2,cost:{food:95,gold:95},time:15,effects:[{stat:'damage',multiplier:1.1,scope:'military'}]},
 vitality:{label:'Endurance',age:2,cost:{food:125,gold:65},time:16,effects:[{stat:'hp',multiplier:1.1,scope:'military'}]},
 harvest:{label:'Outils de récolte',age:2,cost:{wood:100,gold:60},time:13,effects:[{stat:'gatherSpeed',multiplier:1.1,scope:'worker'}]},
 boots:{label:'Bottes légères',age:2,cost:{food:85,wood:90},time:14,effects:[{stat:'movementSpeed',multiplier:1.1,scope:'units'}]},
 reinforcedArmor:{label:'Armure renforcée',age:2,cost:{wood:95,gold:105},time:17,effects:[{stat:'armor',add:1,scope:'military'}]},
 forgedBladesII:{label:'Lames célestes',age:3,requires:'forgedBlades',cost:{food:180,gold:170,stone:45},time:22,effects:[{stat:'damage',multiplier:1.1,scope:'military'}]},
 vitalityII:{label:'Résilience',age:3,requires:'vitality',cost:{food:185,gold:145,stone:40},time:21,effects:[{stat:'hp',multiplier:1.1,scope:'military'}]},
 harvestII:{label:'Récolte experte',age:3,requires:'harvest',cost:{wood:190,gold:110,stone:35},time:18,effects:[{stat:'gatherSpeed',multiplier:1.1,scope:'worker'}]},
 bootsII:{label:'Marche céleste',age:3,requires:'boots',cost:{food:150,wood:135,stone:35},time:19,effects:[{stat:'movementSpeed',multiplier:1.1,scope:'units'}]},
 reinforcedArmorII:{label:'Armure divine',age:3,requires:'reinforcedArmor',cost:{wood:160,gold:160,stone:55},time:23,effects:[{stat:'armor',add:1,scope:'military'}]}
};
const POWERS={
 healing:{label:'Bénédiction astrale',age:3,cost:{food:85,gold:75},cooldown:65,radius:290,heal:50},
 storm:{label:'Tempête astrale',age:3,cost:{gold:110,stone:50},cooldown:85,radius:420,blastRadius:95,damage:55}
};

const AI={
 barracksDelay:35,trainEvery:9,workerTrainEvery:13,workerGoals:[6,8,10],
 waveStages:[{after:0,size:6,cooldown:90},{after:240,size:11,cooldown:110},{after:500,size:20,cooldown:135}],
 defenseRadius:310,defenderRadius:680,defenseQuiet:8,
 // Pixel positions on the 1448 × 1086 map; the physics still use terrain.js.
 bridges:[[1090,410],[1090,760]]
};
// Difficulty changes decisions and pacing only. Unit stats, costs and starting stock are shared.
const AI_DIFFICULTIES={
 easy:{label:'Simple',thinkInterval:3.2,workerInterval:18,workerGoals:[5,6,7],barracksDelay:58,secondBarracksAt:320,ageDelay:310,ageIIIAt:650,trainInterval:12,waveStages:[{after:0,size:6,cooldown:315},{after:450,size:8,cooldown:165},{after:800,size:10,cooldown:155}],defenseRadius:245,defenderRadius:460,defenseQuiet:14,defenderLimit:3,counterUnits:false,multiAttack:false,economicBonus:0},
 normal:{label:'Normal',thinkInterval:1.6,workerInterval:11,workerGoals:[6,9,13],barracksDelay:AI.barracksDelay,secondBarracksAt:150,ageDelay:260,ageIIIAt:550,ageIIIWaves:3,trainInterval:7.5,waveStages:[{after:0,size:10,cooldown:245},{after:300,size:14,cooldown:95},{after:620,size:16,cooldown:95},{after:1100,size:18,cooldown:105}],defenseRadius:AI.defenseRadius+45,defenderRadius:AI.defenderRadius,defenseQuiet:AI.defenseQuiet,defenderLimit:7,counterUnits:true,counterThreshold:4,counterWeight:1.35,counterInterval:30,multiAttack:false,economicBonus:0},
 hard:{label:'Difficile',thinkInterval:1,workerInterval:9,workerGoals:[7,10,16],barracksDelay:35,secondBarracksAt:145,ageDelay:200,ageIIIAt:550,ageIIIWaves:3,trainInterval:6.5,waveStages:[{after:0,size:14,cooldown:95},{after:560,size:18,cooldown:85},{after:1000,size:20,cooldown:75},{after:1500,size:24,cooldown:75}],defenseRadius:400,defenderRadius:850,defenseQuiet:5,defenderLimit:9,counterUnits:true,counterThreshold:3,counterWeight:1.8,counterInterval:25,multiAttack:true,economicBonus:0}
};


// js/terrain.js
// Baked collision data from the annotated map. . normal, g forest, X rock, # water.
// The illustration is separate and this file runs offline without Python.
const TERRAIN_ROWS=[
 '...........................###############XX..........................................X.....XX........................................X..........',
 '............................###############XXX......................................XX.....XX........................................X...........',
 '...............................#############XXXX...................................X.....XX............gggggggg....................XX............',
 '...................................#########XXXXXXXXX...................................X..........gggggggggggggg.................X..............',
 '.....................................########XXXXXXXXXXXXX.........................X..XX........ggggggggggggggggggg...............X..............',
 '.......................................#######XXXXXXXXXXXXX........................XXX........ggggggggggggggggggggggg.............X..............',
 '.......................................#####..##XXXXXXXXXXXX........................X........gggggggggggggggggggggggggg...........XX.............',
 '........................................#####...####XXXXXXXXX...............................ggggggggggggggggggggggggggggg..........XX............',
 '........................................##...##.####.#XXXXXXX..............................gggggggggggggg.XXXXXXgggggggggg...........XX..........',
 '........................................#...########.###XXXX....................X.........ggggggggggggg.XX......XX.ggggggggg...........X.........',
 '.........................................################XXXX...................XX........ggggggggggggg...........XX.gggggggg...........X........',
 '..........................................##....######..##XXXX.................XXXXX......gggggggggggg..X............XX.ggggggg..........X.......',
 '...................................................########XXX.................XXXXX......gggggggggggg.XXX.............XX.gggggg..........X......',
 '...................................................XX#######XXX...............XXXXXX.......gggggggggg..X..X..............XX.ggggg..........X.....',
 '...................................................XX#######XXX...............XXXXXX........ggggggggg..X...XX..............XXggggg..........XX...',
 '...................................................XX######.#XXX.............XXXXXX.........ggggggggg..X....XX...............XXgggg...........XX.',
 '...................................................XX####...#XXX.............XXXXXX...........gggggggg........X...............XXXXX.............X',
 '...................................................XX#####...XXXX............XXXXXX............gggggggg........X..............XXXXXX.............',
 'XX.................................................XX#####....XXX............XXXXXX.............gggggggg........X.........XXXXXXXXXX.............',
 '..XX...............................................XX##..######X.....XXX.....XXXXX................ggggggg........X.......XXXXXXXXXX..............',
 '....X.............................................XXX########.#......XXXXXXXXXXXXX.................gggggggX.......X.....XXXXXXXXXX...............',
 '.....X..........................................XXXXXXX...#..##......#XXXXXXXXXXX....................gggggg.X......X....XXXXXXXXX................',
 '.....X.........................................XXXXXXXX....###.......######XXXXX#......................ggggg.XX.....XX...XXXXXXX.................',
 '......X.......................................XXXXXXXX..............###############......................ggggg.XX.....X....XXXX..................',
 '.......X.....................................XXXXXXXXX...............#################....................ggggg..XX.....X.................gggg...',
 '........X.................................XXXXXXXXXXX.................##################....................gggg...X....XX...............gggggg..',
 'X........X...............................XXXXXXXXXXX....................#################.....gggg...........ggggg..XX....XX.............gggggggg',
 '.X........X...............................XXXXXXXXX.......................#####..#########...ggggggg...........gggg...X.....XX..........ggggggggg',
 '..X........X...............................XXXXXX.................................########...ggggggggg.................X......X.........ggggggggg',
 '...XX.......X....................XX........XXXX....................................#######..ggggggggggg..................XX.....XX......ggggggggg',
 '.....X........XX...............XX..X........XX.......ggggggggggggg..................#######...gggggggggg...................XX.....XX.....gggggggg',
 '......X.........XXXXXXXXXXXXXX.....XX.......X......ggggggggggggggg...................######.....ggggggggg....................XX......X....ggggggg',
 '.......X............................X.............ggggggggggggggggg..................######.......gggggggg.....................XX......X....ggggg',
 '........XX...........................XX..........ggggggggggggggggg...................#######........gggggg.......................XX......XX..gggg',
 '..........XX......................XXX............ggggggggggggggggg....................########.......................ggggggggg.....XX......XX..gg',
 '#............XX..............XXXX................ggggggggggggggggg.....................#########....................ggggggggggggg....XX.......XX.',
 '#######........XX.......XXXX.....................gggggggggggggggg......................#############.................gggggggggggggg....X........X',
 '########..........XXXXXX..........................gggggggggggggg.......................###############................gggggggggggggg.....X.......',
 '#########..........................................gggggggggggg.........................###############................gggggggggggggg.....XX.....',
 '############........................XXXXX...........ggggggggggg..........................################..............ggggggggggggggg......X....',
 '##############....................XXXXXXXXXXXX.......gggggggg.....gggg...................#################..............gggggggggggggg.......X...',
 '###############...................XXXXXXXXXXXXX................ggggggggggg................################...............gggggggggggggg.......XX.',
 '####g#g#########..................XXXXXXXXXXXXXX............gggggg.....ggggg..................############.....####......ggggggggggggggg........X',
 '.ggggggg.#######..................XXXXXXXXXXXXXX...........ggggggXX..XXXX.gggg.......................####......######.....ggggggggggggggg........',
 '.ggggggggg#####...................XXXXXXXXXXXXX..........gggggggX.........XXgggg........................#......#######.....ggggggggggggggg.......',
 '.ggggggggggg###....................XXXXXXXXXXXX.........ggggggggX...........XXgggg............................########.....ggggggggggggggggg.....',
 '.gggggggggggg##.....................XXXXXXXXXX..........gggggggX..............XXgggg...........................########.....ggggggggggggggggg....',
 '.ggggggggggg.#####...................XXXXXXXX..........ggggggggX................XXgggg.........................########.....ggggggggg.gggggggg...',
 '.ggggggggggXXX#########................XXX.............ggggggggX.................XXXggg........................#########....ggggggggg..ggggggg...',
 '.ggggggggggXXXX###########............................gggggggggX...................XXggg............X..........#########.....ggggggg...gggggggg..',
 '.ggggggggggXXXXX###########...........................gggggggggX...................XXXggg...........XX.........##########.....ggggg....gggggggg..',
 '.ggggggggggXXXXXX############.........................gggggggggX....................XXggg..........XXXX........##########...........##..ggggggg..',
 '.ggggggggggXXXXXXX############........................gggggggggX....................XXggg.........XXXXX.........##########..........##..ggggggg..',
 '.gggggggggggXXXXXXX#X###########.......................ggggggggXX..................XXX.ggg.......XXXXXXX.......###########.........####.gggggggg.',
 '.ggggggggggggXXXXXXXXXX....######......................ggggggggXXX.................XXX.ggg.....XXXXXXXXXX.......##########.........####.gggggggg.',
 '.ggggggggggggXXXXXXXXXXX...########.....................ggggggggXXX...............XXXX.ggg.....XXXXXXXXXX.......##########........####...gggggggg',
 '...gggggggggggXXXXXXXXXXX...######......###.............ggggggggXXXXXX............XXXX.gg.......XXXXXXXXX........#############...#####.....gggggg',
 '....gggggggggggXXXXXXXXXXXX..#####.....#######...........gggggggXXXXXXXXX..........XXX.gg........XXXXXXXXX.......###############.#####......ggggg',
 '......ggggggggg.XXXXXXXXXXXXX.###......#########...........ggggggXXXXXXXXXXXXXX....XXXgg...........XXXXXXXX.......###################.........ggg',
 '........gggggggg.XXXXXXXXXXXXXX.......###########...........ggggggXXXXXXXXXXXXX....................XXXXXXXXX.........################...........g',
 '..........ggggggg..XXXXXXXXXX.........############............gggggggXXXXXXXXXXX..................XXXXXXXXXXX...............#########............',
 '............ggggggggg....g..............###########............ggggggggXXXXXXXXXX.................XXXXXXXXXXX................#########...........',
 '..............gggggggggggg..........ggg...###########.............ggggggggXXXXXXXX................XXXXXXXXXXX..................###########.......',
 'gg.............ggggggggggg..........ggggg..#############...........gggggggggXXXXXX................XXXXXXXXXX....................#############....',
 'ggg...............gggggggg...........ggggg..###############..........gggggggggggg.................XXXXXXXXX.....................#################',
 'gggg...............ggggggg............ggggggg...##############.........ggggggggg.......gg..........XXXXXXX.......................################',
 'ggggg.................ggg.............ggggggggg.#################.........ggggg.......ggggggg.......XXXXX..........................##############',
 'gggggg.......ggg.......................gggggggggg.################..................gggggggggg.......XX..................XX..XX......############',
 'ggggggg.....ggggggggggg................ggggggggggg.###############...............gggggggggggggg.........................X..XXX.XX....############',
 'ggggggg......gggggggggg.................ggggggggggg..#############.............ggggggggggggggggg......................XXXXX...X...X....#####.####',
 'gggggggg......gggggggggg....ggggg........ggggggggggg.####....#####............ggggggggggggggggggg....................XXXX......XX...XX.........##',
 'gggggggg.......ggggggggggggggggggg........gggggggggg..###.....................ggggggggggggggggggg..................XXX...........X....XX........#',
 'gggggggg........ggggggggggg...Xgggg.........ggggggggg..##.....................ggggggggggggggggggg................XXX...............XX...X........',
 'gggggggg.........gggggggg..XXXXX..gg..........gggggg....###....................ggggggggggggggggg...............XXXX..................XX...X......',
 'ggggg............gggggggXXXXXXXXX...gg..................###....................gggggggggggggggg............XXXXXX.....................X....X.....',
 'ggg..............gg...XXXXXXXXXXXX...gg.................####.....................gggggggggggg...............XXXX.......................X....X....',
 'gg...................XXXXXXXXXXXXXXX..ggg...............#####......................ggggggggg.........X..................................X....XX..',
 'g....................XXXXXXXXXXXXXXXXX.gggg.............######....................................XXXXX..................................X.....X.',
 '...............gggggXXXXXXXXXXXXXXXXXXXggggg............############............................XXXXXX.X..................................X.....X',
 '..............ggggggXXXXXXXXXXXXXXXXXXXXggggggg.........#################.....................XXXXX........................................X....X',
 '.............gggggggXXXXXXXXXXXXXXXXXXXXggggggg...........################...................XXXX..........................................X.....',
 '.............gggggggXXXXXXXXXXXXXXXXXXXXggggggg............################.................XX..............................................X....',
 '.............gggggg.XXXXXXXXXXXXXXXXXXXXXgggggg............#################...............XX................................................X...',
 '.............ggggggXXXXXXXXXXXXXXXXXXXXXXgggggg................#############...............XX.................................................X.X',
 'gggg........ggggggXXXXXXXXXXXXXXXXXXXXXXXXggggg....................#########...............XX..................................................XX',
 'gggggg......ggggggggXXXXXXXXXXXXXXXXXXXXXXgggggg........................###.#......#######.XXX..................................................X',
 'ggggggg......gggggggggXXXXXXXXXXXXXXXXXXXXXggggg.........................##.......##......##XXXX................................................X',
 'ggggggg........ggggggggXXXXXXXXXXXXXXXXXXXXXggggg.................................####..###XXXXXXX..............................................X',
 '.ggggggg...........gggggXXXXXXXXXXXXXXXXXXXXX..gg.................................#########XXXXXXXXX............................................X',
 'ggggggggg...........gggggXXXXXXXXXXXXXXXXXXXXXXggg...................................#..###XXXXXXXXXXX..........................................X',
 'gggggggggg............ggggXXXXXXXXXXXXXXXXXXXXXXggg...................................######XXXXXXXXXXX.........................................X',
 'gggg.ggggggg...............XXXXXXXXXXXXXXXXXXXX.ggg...................................######.XXXXXXXXXXX.......................................XX',
 'gX..Xggggggggg..............XXXXXXXXXXXXXXXXXX.ggggg...................................#######.XXXXXXXXXX......................................XX',
 '.....Xggggggggggg............XXXXXXXXXXXXXXXXX.ggggg............gggggg...................#######XXXXXXXXXX.....................................XX',
 '..........XXggggggggg.........XXXXXXXXXXXXXXXXggggggg.........ggggggggg..................########XXXXXXXXXXX...................................XX',
 '...........XXgggggggg..........XXXXXXXXXXXXXXgggggggg........gggggggggggg......gggggg.....####..#.XXXXXXXXXXXX.................................XX',
 '.............Xggggggg...........XXXXXXXXXXXXggggggggg.......gggggggggggggg...gggggggggggg.#####..#.XXXXXXXXXXXX................................XX',
 '..............Xgggggg.............XXXXXXXXggggggggggg......ggggggggggggggg..gggggggggggggg#####..#..XXXXXXXXXXXX...............................XX',
 '..............X.ggggg..............XXXXXgggggggggggg.......ggggggggggggg....gggggggggggggg#######.###XXXXXXXXXXXX.............................XXX',
 '...............XXggggg.............ggggggggggggggg..........gggggggggg......gggggggggggggg.############XXXXXXXXXXXX..........................XXXX',
 '................Xgggggg............gggggggggggggg...........................gggggggggggggXX.########..###XXXXXXXXXXX.......................XXXXXX',
 '.................Xgggggg...........gggggggggggg...........XXX...............gggggggggggg.XXXXXXX....##...##XXXXXXXXXX..................XXXXXXXXXX',
 '.................Xggggggg..........gggggggggg.............XXXXXXXXX..........gggggggggg.XXXXXXXXXXXX.###..##XXXXXXXXXX.............XXXXXXXXXXXXXX',
 'XXXXX............Xgggggggg..........gggggg................XXXXXXXXXX..........ggggggg..XXXXXXXXXXXXXXX#######XXXXXXXXXXXX....XXXXXXXXXXXXXXXXXXXX',
 'ggggggXX.........X.gggggggg..............................XXXXXXXXXX.............ggg....XXXXXXXXXXXXXXX########.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 'ggggggg.X........X.gggggggg.............................XXXXXX.............................XXXXXXXXXXXXX########XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 'gggggggggXXXX...X.ggggggggg.............................XXX.....................................XXXXXXXX###########XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 'gggggggggggggXggggggggggggg.............................XXX.......................................XXXXXXXXX##########XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 'ggggggggggggggggggggggggggg.............................XX............................................XXXXX###########XXXXXXXXXXXXXXXXXXXXXXXXXXX',
];
const TERRAIN_COLS=145,TERRAIN_HEIGHT=109;
function terrainAt(x,y,width,height){
 const col=Math.floor(x/width*TERRAIN_COLS),row=Math.floor(y/height*TERRAIN_HEIGHT);
 return col<0||row<0||col>=TERRAIN_COLS||row>=TERRAIN_HEIGHT?'#':TERRAIN_ROWS[row][col];
}
function terrainBlocked(x,y,width,height){return '#X'.includes(terrainAt(x,y,width,height));}
function terrainSpeed(x,y,width,height){return terrainAt(x,y,width,height)==='g'?.5:1;}
function terrainBuildable(x,y,width,height){return terrainAt(x,y,width,height)==='.';}


// js/fog.js


function createFog(map=MAP){
 const cell=40,cols=Math.ceil(map.width/cell),rows=Math.ceil(map.height/cell);
 return {cell,cols,rows,visible:new Uint8Array(cols*rows),explored:new Uint8Array(cols*rows),version:0};
}
function updateVision(w){
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
function fogAt(w,x,y){
 const fog=w.fog;
 if(!fog||x<0||y<0||x>=w.map.width||y>=w.map.height)return 0;
 const col=Math.floor(x/fog.cell),row=Math.floor(y/fog.cell),index=row*fog.cols+col;
 return fog.visible[index]?2:fog.explored[index]?1:0;
}
function isEntityVisible(w,entity){
 return entity.team==='player'||fogAt(w,entity.x,entity.y)===2;
}


// js/minimap.js

function minimapBounds(camera){
 const width=Math.min(160,Math.max(105,camera.width*.24)),height=width*MAP.height/MAP.width;
 return {x:camera.width-width-16,y:camera.height-height-16,width,height};
}
function pointInMinimap(camera,x,y){
 const r=minimapBounds(camera);
 return x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;
}
function minimapToWorld(camera,x,y){
 if(!pointInMinimap(camera,x,y))return null;
 const r=minimapBounds(camera);
 return {x:Math.max(0,Math.min(MAP.width,(x-r.x)/r.width*MAP.width)),y:Math.max(0,Math.min(MAP.height,(y-r.y)/r.height*MAP.height))};
}


// js/progression.js



const fail=reason=>({ok:false,reason});
const canPayProgress=(w,team,cost)=>Object.entries(cost).every(([key,amount])=>(w.stock[team]?.[key]||0)>=amount);
const payProgress=(w,team,cost)=>{for(const [key,amount] of Object.entries(cost))w.stock[team][key]-=amount;};
const currentAge=(w,team='player')=>w.progression?.[team]?.age||1;
const unlocked=(w,team,kind)=>currentAge(w,team)>=(UNLOCK_AGE[kind]||1);

function statValue(w,team,kind,stat){
 let result=stat==='gatherSpeed'?1:(TYPES[kind]?.[stat]||0);
 for(const key of w?.progression?.[team]?.techs||[]){
  for(const effect of TECHNOLOGIES[key]?.effects||[]){
   const matches=effect.scope==='units'||effect.scope==='worker'&&kind==='worker'||effect.scope==='military'&&kind!=='worker'&&TYPES[kind]?.populationCost;
   if(matches&&effect.stat===stat)result=result*(effect.multiplier||1)+(effect.add||0);
  }
 }
 return result;
}

function beginAge(w,townId,team='player'){
 const town=w.buildings.find(b=>b.id===townId&&b.kind==='town'&&b.team===team&&b.complete&&b.hp>0);
 if(!town)return fail('Sélectionne ton sanctuaire');
 const next=currentAge(w,team)+1;
 if(!AGES[next])return fail('Âge maximal atteint');
 if(w.buildings.some(b=>b.team===team&&b.research?.type==='age'))return fail('Un âge est déjà en préparation');
 if(town.research||town.queue.length)return fail('Sanctuaire occupé');
 if(!canPayProgress(w,team,AGES[next].cost))return fail('Ressources insuffisantes');
 payProgress(w,team,AGES[next].cost);town.research={type:'age',key:next,progress:0};
 return {ok:true};
}

function beginResearch(w,workshopId,key,team='player'){
 const def=TECHNOLOGIES[key],shop=w.buildings.find(b=>b.id===workshopId&&b.kind==='workshop'&&b.team===team&&b.complete&&b.hp>0);
 if(!shop)return fail('Sélectionne un atelier terminé');
 if(!def)return fail('Technologie inconnue');
 if(currentAge(w,team)<def.age)return fail(`Requiert l’${AGES[def.age].label}`);
 if(w.progression[team].techs.includes(key)||w.buildings.some(b=>b.team===team&&b.research?.type==='tech'&&b.research.key===key))return fail('Recherche déjà acquise ou en cours');
 if(def.requires&&!w.progression[team].techs.includes(def.requires))return fail('Amélioration précédente requise');
 if(shop.research||shop.queue.length)return fail('Atelier occupé');
 if(!canPayProgress(w,team,def.cost))return fail('Ressources insuffisantes');
 payProgress(w,team,def.cost);shop.research={type:'tech',key,progress:0};
 return {ok:true};
}

function tickProgression(w,dt){
 for(const building of w.buildings){
  const job=building.research;
  if(!job||building.hp<=0||!building.complete)continue;
  const duration=job.type==='age'?AGES[job.key].time:TECHNOLOGIES[job.key].time;
  job.progress+=dt;
  if(job.progress+1e-8<duration)continue;
  if(job.type==='age')w.progression[building.team].age=job.key;
  else{
   w.progression[building.team].techs.push(job.key);
   for(const unit of w.units.filter(u=>u.team===building.team&&u.hp>0&&u.type==='unit')){
    const max=Math.round(statValue(w,unit.team,unit.kind,'hp'));
    if(max>unit.maxHp){unit.hp=Math.min(max,unit.hp+max-unit.maxHp);unit.maxHp=max;}
   }
  }
  building.research=null;
 }
}

function usePower(w,townId,key,team='player'){
 const power=POWERS[key],town=w.buildings.find(b=>b.id===townId&&b.kind==='town'&&b.team===team&&b.complete&&b.hp>0);
 if(!town)return fail('Sanctuaire indisponible');
 if(!power)return fail('Pouvoir inconnu');
 if(currentAge(w,team)<power.age)return fail(`Requiert l’${AGES[power.age].label}`);
 if((w.progression[team].readyAt[key]||0)>w.time)return fail('Pouvoir en recharge');
 if(!canPayProgress(w,team,power.cost))return fail('Ressources insuffisantes');
 let targets=[];
 if(key==='healing')targets=w.units.filter(u=>u.team===team&&u.hp>0&&u.hp<u.maxHp&&Math.hypot(u.x-town.x,u.y-town.y)<=power.radius);
 else{
  const enemies=w.units.filter(u=>u.team!==team&&u.hp>0&&Math.hypot(u.x-town.x,u.y-town.y)<=power.radius&&(team!=='player'||fogAt(w,u.x,u.y)===2));
  enemies.sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y));
  if(enemies.length)targets=w.units.filter(u=>u.team!==team&&u.hp>0&&Math.hypot(u.x-enemies[0].x,u.y-enemies[0].y)<=power.blastRadius);
 }
 if(!targets.length)return fail(key==='storm'?'Aucun ennemi visible à portée':'Aucun allié blessé à portée');
 payProgress(w,team,power.cost);
 for(const target of targets)if(key==='healing')target.hp=Math.min(target.maxHp,target.hp+power.heal);
 else target.hp=Math.max(0,target.hp-Math.max(1,power.damage-statValue(w,target.team,target.kind,'armor')));
 w.progression[team].readyAt[key]=w.time+power.cooldown;
 return {ok:true,targets:targets.length};
}


// js/world.js




function makeUnit(w,kind,team,x,y){const hp=Math.round(statValue(w,team,kind,'hp'));return {id:w.nextId++,type:'unit',kind,team,x,y,hp,maxHp:hp,order:null,path:[],carry:0,carryKind:null,work:0,cooldown:0};}
function makeBuilding(w,kind,team,x,y,complete=true){return {id:w.nextId++,type:'building',kind,team,x,y,hp:complete?TYPES[kind].hp:Math.ceil(TYPES[kind].hp*.25),maxHp:TYPES[kind].hp,complete,progress:complete?TYPES[kind].time:0,queue:[],spawnProgress:0,research:null};}
function getEntity(w,id){return w.units.find(u=>u.id===id)||w.buildings.find(b=>b.id===id)||w.nodes.find(n=>n.id===id);}
const unitRadius=u=>u.kind==='mythic'?19:u.kind==='cavalry'?16:u.kind==='champion'?14:u.kind==='soldier'||u.kind==='spearman'?12:u.kind==='archer'?11:10;
function unitSpotFree(w,u,x,y){return isWalkable(w,x,y,unitRadius(u))&&!w.units.some(other=>other!==u&&other.hp>0&&Math.hypot(other.x-x,other.y-y)<unitRadius(u)+unitRadius(other));}
function isWalkable(w,x,y,margin=13){return x>=margin&&y>=margin&&x<=MAP.width-margin&&y<=MAP.height-margin&&!terrainBlocked(x,y,MAP.width,MAP.height)&&!w.buildings.some(b=>b.hp>0&&Math.hypot(x-b.x,y-b.y)<TYPES[b.kind].radius+margin+5);}
function canBuild(w,x,y,radius,protectResources=false){
 if(!isWalkable(w,x,y,radius))return false;
 if(w.units.some(u=>u.hp>0&&Math.hypot(u.x-x,u.y-y)<radius+unitRadius(u)+5))return false;
 if(protectResources&&w.nodes.some(n=>n.amount>0&&Math.hypot(n.x-x,n.y-y)<radius+55))return false;
 for(let yy=y-radius;yy<=y+radius;yy+=10)for(let xx=x-radius;xx<=x+radius;xx+=10)
  if(Math.hypot(xx-x,yy-y)<=radius+3&&!terrainBuildable(xx,yy,MAP.width,MAP.height))return false;
 return terrainBuildable(x,y,MAP.width,MAP.height);
}
const mapPoint=(x,y)=>({x:Math.round(x*MAP.width/1448),y:Math.round(y*MAP.height/1086)});
function createWorld(difficulty='normal'){
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
function findPath(w,from,to,mover=null){
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


// js/camera.js
function screenToWorld(camera,x,y){return{x:camera.x+(x-camera.width/2)/camera.zoom,y:camera.y+(y-camera.height/2)/camera.zoom};}
function worldToScreen(camera,x,y){return{x:(x-camera.x)*camera.zoom+camera.width/2,y:(y-camera.y)*camera.zoom+camera.height/2};}


// js/selection.js

function toggleSelection(ids,id){return ids.includes(id)?ids.filter(value=>value!==id):[...ids,id];}
function selectSimilarVisible(w,c,kind){
 return w.units.filter(u=>u.team==='player'&&u.hp>0&&u.kind===kind).filter(u=>{
  const s=worldToScreen(c,u.x,u.y);
  return s.x>=0&&s.y>=0&&s.x<=c.width&&s.y<=c.height;
 }).map(u=>u.id);
}
function selectRectangle(w,c,rect){
 const left=Math.min(rect.x,rect.toX),right=Math.max(rect.x,rect.toX),top=Math.min(rect.y,rect.toY),bottom=Math.max(rect.y,rect.toY);
 return w.units.filter(u=>u.team==='player'&&u.hp>0).filter(u=>{
  const s=worldToScreen(c,u.x,u.y);
  return s.x>=left&&s.x<=right&&s.y>=top&&s.y<=bottom;
 }).map(u=>u.id);
}
function storeControlGroup(groups,index,ids,w){
 groups[index]=[...new Set(ids.filter(id=>w.units.some(u=>u.id===id&&u.team==='player'&&u.hp>0)))];
 return groups[index];
}
function recallControlGroup(groups,index,w){
 return (groups[index]||[]).filter(id=>w.units.some(u=>u.id===id&&u.team==='player'&&u.hp>0));
}


// js/game.js





const ok=(reason='')=>({ok:!reason,reason});
const alive=(w,ids,team='player')=>ids.map(id=>w.units.find(u=>u.id===id&&u.team===team)).filter(Boolean);
const affordable=(w,team,cost)=>Object.entries(cost).every(([k,v])=>w.stock[team][k]>=v);
const pay=(w,team,cost)=>{for(const[k,v]of Object.entries(cost))w.stock[team][k]-=v;};
const aiSettings=w=>AI_DIFFICULTIES[w.difficulty]||AI_DIFFICULTIES.normal;
function setDestination(w,u,x,y){const angle=Math.atan2(y-u.y,x-u.x);for(const radius of [0,45,75,115]){const tx=x-Math.cos(angle)*radius,ty=y-Math.sin(angle)*radius;const path=findPath(w,u,{x:tx,y:ty},u);if(path.length){u.path=path;return true;}}u.path=[];return false;}
function setApproach(w,u,building){
 const angle=Math.atan2(u.y-building.y,u.x-building.x),radius=TYPES[building.kind].radius+25;
 const offsets=[0,.4,-.4,.8,-.8,1.2,-1.2],first=u.id%offsets.length;
 for(let i=0;i<offsets.length;i++){
  const theta=angle+offsets[(first+i)%offsets.length],x=building.x+Math.cos(theta)*radius,y=building.y+Math.sin(theta)*radius;
  if(!unitSpotFree(w,u,x,y))continue;
  const path=findPath(w,u,{x,y},u);if(path.length){u.path=path;return true;}
 }
 return setDestination(w,u,building.x,building.y);
}
function orderMove(w,ids,x,y,formation='compact'){
 if(x<0||x>MAP.width||y<0||y>MAP.height)return ok('Hors de la carte');
 const units=alive(w,ids);
 if(!units.length)return ok('Sélectionne une unité');
 const center={x:units.reduce((sum,u)=>sum+u.x,0)/units.length,y:units.reduce((sum,u)=>sum+u.y,0)/units.length};
 const angle=Math.atan2(y-center.y,x-center.x),fx=Math.cos(angle),fy=Math.sin(angle),sx=-fy,sy=fx;
 const spacing=Math.max(38,...units.map(u=>unitRadius(u)*2+10));
 units.sort((a,b)=>(a.x-center.x)*sx+(a.y-center.y)*sy-((b.x-center.x)*sx+(b.y-center.y)*sy));
 const columns=formation==='line'?units.length:Math.ceil(Math.sqrt(units.length)),rows=Math.ceil(units.length/columns),reserved=[];
 let assigned=0;
 for(const [i,u] of units.entries()){
  const lateral=(i%columns-(columns-1)/2)*spacing,depth=formation==='line'?0:(Math.floor(i/columns)-(rows-1)/2)*spacing;
  const slot={x:x+sx*lateral-fx*depth,y:y+sy*lateral-fy*depth};
  let route=null,target=null;
  for(const radius of [0,spacing,spacing*2,spacing*3,spacing*4]){
   for(let j=0;j<(radius?12:1);j++){
    const px=slot.x+radius*Math.cos(j*Math.PI/6),py=slot.y+radius*Math.sin(j*Math.PI/6);
    if(!isWalkable(w,px,py,unitRadius(u)+2)||reserved.some(p=>Math.hypot(p.x-px,p.y-py)<p.radius+unitRadius(u)+8))continue;
    if(w.units.some(other=>other!==u&&other.hp>0&&!units.includes(other)&&Math.hypot(other.x-px,other.y-py)<unitRadius(other)+unitRadius(u)+4))continue;
    const path=findPath(w,u,{x:px,y:py},u);
    if(path.length||Math.hypot(px-u.x,py-u.y)<4){route=path;target={x:px,y:py};break;}
   }
   if(target)break;
  }
  if(!target)continue;
  u.order={type:'move',x:target.x,y:target.y};u.path=route;reserved.push({...target,radius:unitRadius(u)});assigned++;
 }
 return assigned?ok():ok('Aucun passage accessible');
}
function orderGather(w,ids,nodeId){const n=w.nodes.find(n=>n.id===nodeId&&n.amount>0);if(!n)return ok('Ressource épuisée');const units=alive(w,ids).filter(u=>u.kind==='worker');for(const u of units){u.order={type:'gather',target:n.id};setDestination(w,u,n.x,n.y);}return units.length?ok():ok('Sélectionne un ouvrier');}
function population(w,team){const max=w.buildings.filter(b=>b.team===team&&b.complete&&b.hp>0).reduce((a,b)=>a+(TYPES[b.kind].pop||0),0);const used=w.units.filter(u=>u.team===team&&u.hp>0).reduce((n,u)=>n+(TYPES[u.kind].populationCost||1),0)+w.buildings.filter(b=>b.team===team).reduce((n,b)=>n+b.queue.reduce((sum,kind)=>sum+(TYPES[kind].populationCost||1),0),0);return {used,max};}
function startConstruction(w,ids,kind,x,y,team='player'){if(!['house','barracks','workshop'].includes(kind))return ok('Bâtiment inconnu');if(!unlocked(w,team,kind))return ok('Âge supérieur requis');if(!canBuild(w,x,y,TYPES[kind].radius,team==='enemy'))return ok('Emplacement bloqué : éloigne les unités ou choisis un autre endroit');const units=alive(w,ids,team).filter(u=>u.kind==='worker');if(!units.length)return ok('Sélectionne un ouvrier');if(!affordable(w,team,TYPES[kind].cost))return ok('Ressources insuffisantes');pay(w,team,TYPES[kind].cost);const b=makeBuilding(w,kind,team,x,y,false);w.buildings.push(b);for(const u of units){u.order={type:'build',target:b.id};setApproach(w,u,b);}return {ok:true,building:b};}
function orderBuild(w,ids,buildingId){const b=w.buildings.find(b=>b.id===buildingId&&b.team==='player'&&b.hp>0&&!b.complete);if(!b)return ok('Chantier indisponible');const workers=alive(w,ids).filter(u=>u.kind==='worker');if(!workers.length)return ok('Sélectionne un ouvrier');for(const u of workers){u.order={type:'build',target:b.id};setApproach(w,u,b);}return ok();}
function orderInteract(w,ids,buildingId,formation='compact'){
 const b=w.buildings.find(b=>b.id===buildingId&&b.team==='player'&&b.hp>0&&b.complete);
 if(!b)return ok('Bâtiment indisponible');
 const units=alive(w,ids);
 if(!units.length)return ok('Sélectionne une unité');
 const carriers=units.filter(u=>u.kind==='worker'&&u.carry>0&&b.kind==='town');
 for(const u of carriers){u.order={type:'deliver',target:b.id};setApproach(w,u,b);}
 const others=units.filter(u=>!carriers.includes(u));
 if(others.length){
  const angle=Math.atan2(others[0].y-b.y,others[0].x-b.x);
  orderMove(w,others.map(u=>u.id),b.x+Math.cos(angle)*(TYPES[b.kind].radius+70),b.y+Math.sin(angle)*(TYPES[b.kind].radius+70),formation);
 }
 return ok();
}
function queueUnit(w,buildingId,kind,team='player'){const b=w.buildings.find(b=>b.id===buildingId&&b.team===team&&b.complete&&b.hp>0);if(!b||!((b.kind==='town'&&kind==='worker')||(b.kind==='barracks'&&['soldier','spearman','archer','cavalry','champion'].includes(kind))||(b.kind==='workshop'&&kind==='mythic')))return ok('Bâtiment non disponible');if(!unlocked(w,team,kind))return ok('Âge supérieur requis');if(b.research)return ok('Bâtiment occupé par une recherche');if(population(w,team).used+TYPES[kind].populationCost>population(w,team).max)return ok('Construis une maison');if(!affordable(w,team,TYPES[kind].resourceCost))return ok('Ressources insuffisantes');pay(w,team,TYPES[kind].resourceCost);b.queue.push(kind);return ok();}
function orderAttack(w,ids,targetId){const t=getEntity(w,targetId);if(!t||!('hp'in t)||t.hp<=0)return ok('Cible absente');const units=alive(w,ids).filter(u=>u.team!==t.team);for(const u of units){u.order={type:'attack',target:targetId};setDestination(w,u,t.x,t.y);}return units.length?ok():ok('Aucune unité valide');}
function stepMove(w,u,dt){
 if(!u.path.length)return;
 u.navTime=(u.navTime||0)+dt;
 if(u.navTime>=1.4){
  if(u.navX!==undefined&&Math.hypot(u.x-u.navX,u.y-u.navY)<12){
   const goal=u.order?.type==='gather'&&u.carry>=10?nearestTown(w,u):getEntity(w,u.order?.target);
   if(goal?.type==='building')setApproach(w,u,goal);
   else if(goal)setDestination(w,u,goal.x,goal.y);
   else if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
  }
  u.navTime=0;u.navX=u.x;u.navY=u.y;
 }
 if(!u.path.length)return;
 let p=u.path[0],d=Math.hypot(p.x-u.x,p.y-u.y);
 // A grid waypoint can be occupied by an idle ally. Once close enough,
 // continue toward the next waypoint instead of circling the occupied spot.
 if(u.path.length>1&&d<unitRadius(u)*2+5&&w.units.some(other=>other!==u&&other.hp>0&&Math.hypot(other.x-p.x,other.y-p.y)<unitRadius(u)+unitRadius(other))){
  u.path.shift();p=u.path[0];d=Math.hypot(p.x-u.x,p.y-u.y);
 }
 if(d<1){u.path.shift();return;}
 const stride=statValue(w,u.team,u.kind,'movementSpeed')*dt*terrainSpeed(u.x,u.y,MAP.width,MAP.height),length=Math.min(stride,d),angle=Math.atan2(p.y-u.y,p.x-u.x);
 for(const offset of [0,.5,-.5,1,-1,1.5,-1.5]){
  const x=u.x+Math.cos(angle+offset)*length,y=u.y+Math.sin(angle+offset)*length;
  if(!unitSpotFree(w,u,x,y))continue;
  u.x=x;u.y=y;
  if(offset===0&&d<=stride+1)u.path.shift();
  return;
 }
 // Another unit can be standing on a waypoint: approach from a free side.
 if(d<unitRadius(u)*2&&u.path.length>1)u.path.shift();
}
function separateUnits(w){
 for(let pass=0;pass<3;pass++)for(let i=0;i<w.units.length;i++)for(let j=i+1;j<w.units.length;j++){
  const a=w.units[i],b=w.units[j];if(a.hp<=0||b.hp<=0)continue;
  const min=unitRadius(a)+unitRadius(b),dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d>=min-.01)continue;
  const nx=d>0?dx/d:1,ny=d>0?dy/d:0,overlap=(min-d)/2+.05;
  const ax=a.x-nx*overlap,ay=a.y-ny*overlap,bx=b.x+nx*overlap,by=b.y+ny*overlap;
  const aFree=isWalkable(w,ax,ay,unitRadius(a)),bFree=isWalkable(w,bx,by,unitRadius(b));
  if(aFree&&bFree){a.x=ax;a.y=ay;b.x=bx;b.y=by;}
  else if(aFree){a.x-=nx*overlap*2;a.y-=ny*overlap*2;}
  else if(bFree){b.x+=nx*overlap*2;b.y+=ny*overlap*2;}
 }
}
function spawnNear(w,b,kind){
 const unit=makeUnit(w,kind,b.team,b.x,b.y),radius=TYPES[b.kind].radius+unitRadius(unit)+10;
 for(let ring=0;ring<6;ring++)for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,r=radius+ring*unitRadius(unit)*2,x=b.x+Math.cos(angle)*r,y=b.y+Math.sin(angle)*r;
  if(unitSpotFree(w,unit,x,y)){unit.x=x;unit.y=y;return unit;}
 }
 return null;
}
function nearestTown(w,u){return w.buildings.filter(b=>b.team===u.team&&b.kind==='town'&&b.hp>0).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];}
function clearApproach(a,b){const distance=Math.hypot(a.x-b.x,a.y-b.y);for(let d=8;d<distance;d+=8){const t=d/distance;if(terrainBlocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,MAP.width,MAP.height))return false;}return true;}
function combatDamage(attacker,target,w=null){
 const bonus=COMBAT.counters[attacker.kind]===target.kind?COMBAT.counterMultiplier:1;
 return Math.max(1,Math.round(statValue(w,attacker.team,attacker.kind,'damage')*bonus-statValue(w,target.team,target.kind,'armor')));
}
function tickProjectiles(w,dt){
 w.projectiles=(w.projectiles||[]).filter(p=>{
  const target=getEntity(w,p.targetId);
  if(!target||target.hp<=0)return false;
  const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy),step=Math.min(COMBAT.projectileSpeed*dt,p.maxDistance-p.travelled);
  if(step<=0)return false;
  const travel=Math.min(step,d),nx=p.x+(d?dx/d*travel:0),ny=p.y+(d?dy/d*travel:0);
  if(terrainBlocked(nx,ny,MAP.width,MAP.height))return false;
  p.x=nx;p.y=ny;p.travelled+=travel;
  if(d<=travel+(target.type==='building'?TYPES[target.kind].radius:unitRadius(target))){
   if(target.team!==p.team)target.hp-=p.damage;
   return false;
  }
  return p.travelled<p.maxDistance;
 });
}
function tickUnit(w,u,dt){
 if(u.hp<=0)return;
 if(u.order?.automatic){
  const current=getEntity(w,u.order.target);
  if(!current||current.hp<=0){
   u.order=u.resumeOrder||null;u.resumeOrder=null;u.path=[];
   if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
   else if(u.order?.target){const goal=getEntity(w,u.order.target);if(goal&&goal.hp>0)setDestination(w,u,goal.x,goal.y);else u.order=null;}
  }
 }
 if(['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&!(u.order?.type==='attack'&&getEntity(w,u.order.target)?.type==='unit'&&!u.order.automatic)){
  const current=u.order?.automatic?getEntity(w,u.order.target):null;
  const foe=current?.hp>0&&current.team!==u.team&&Math.hypot(current.x-u.x,current.y-u.y)<COMBAT.acquisitionRadius+50?current:w.units.filter(other=>other.team!==u.team&&other.hp>0&&Math.hypot(other.x-u.x,other.y-u.y)<=COMBAT.acquisitionRadius&&clearApproach(u,other)).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
  if(foe&&!(u.order?.automatic&&u.order.target===foe.id)){
   if(!u.order?.automatic)u.resumeOrder=u.order;
   u.order={type:'attack',target:foe.id,automatic:true};u.path=[];setDestination(w,u,foe.x,foe.y);
  }
 }
 if(!u.order)return;const o=u.order;if(o.type==='move'){stepMove(w,u,dt);if(!u.path.length)u.order=null;return;}const target=getEntity(w,o.target);if(!target||target.hp!==undefined&&target.hp<=0||target.amount!==undefined&&target.amount<=0&&u.carry===0){u.order=null;u.path=[];if(u.team==='enemy'&&u.raidWave){const town=w.buildings.find(b=>b.team==='player'&&b.kind==='town'&&b.hp>0);if(town)sendRaid(w,u,town,u.raidBridge||0);}return;}if(o.type==='deliver'){if(Math.hypot(u.x-target.x,u.y-target.y)>TYPES[target.kind].radius+32||!clearApproach(u,target)){if(!u.path.length)setApproach(w,u,target);stepMove(w,u,dt);return;}if(u.carry&&u.carryKind)w.stock[u.team][u.carryKind]+=u.carry;u.carry=0;u.carryKind=null;u.order=null;u.path=[];return;}if(o.type==='gather'){const town=nearestTown(w,u);if(!town)return;if(u.carry>=10||target.amount<=0){if(Math.hypot(u.x-town.x,u.y-town.y)>TYPES.town.radius+32||!clearApproach(u,town)){if(!u.path.length)setApproach(w,u,town);stepMove(w,u,dt);return;}w.stock[u.team][u.carryKind||target.kind]+=u.carry;u.carry=0;u.carryKind=null;if(target.amount<=0){u.order=null;return;}u.path=[];}if(Math.hypot(u.x-target.x,u.y-target.y)>30||!clearApproach(u,target)){if(!u.path.length)setDestination(w,u,target.x,target.y);stepMove(w,u,dt);return;}u.path=[];u.work+=dt;if(u.work>=.65/statValue(w,u.team,u.kind,'gatherSpeed')){u.work=0;const take=Math.min(2,10-u.carry,target.amount);target.amount-=take;u.carry+=take;u.carryKind=target.kind;}return;}if(o.type==='build'){if(target.complete){u.order=null;return;}if(Math.hypot(u.x-target.x,u.y-target.y)>TYPES[target.kind].radius+36||!clearApproach(u,target)){if(!u.path.length)setApproach(w,u,target);stepMove(w,u,dt);return;}u.path=[];target.progress+=dt;target.hp=Math.min(target.maxHp,target.hp+target.maxHp/TYPES[target.kind].time*dt);if(target.progress>=TYPES[target.kind].time){target.complete=true;target.hp=target.maxHp;u.order=null;}return;}if(o.type==='attack'){const range=TYPES[u.kind].attackRange+(target.type==='building'?TYPES[target.kind].radius:0);if(Math.hypot(u.x-target.x,u.y-target.y)>range||!clearApproach(u,target)){if(!u.path.length)setDestination(w,u,target.x,target.y);stepMove(w,u,dt);return;}u.path=[];u.cooldown-=dt;if(u.cooldown<=0){if(u.kind==='archer'){w.projectiles.push({x:u.x,y:u.y,targetId:target.id,team:u.team,damage:combatDamage(u,target,w),travelled:0,maxDistance:COMBAT.projectileMaxDistance});}else{target.hp-=combatDamage(u,target,w);if(u.kind==='mythic')for(const other of w.units)if(other!==target&&other.team!==u.team&&other.hp>0&&Math.hypot(other.x-target.x,other.y-target.y)<55)other.hp-=Math.round(combatDamage(u,other,w)*.4);}u.cooldown=TYPES[u.kind].attackSpeed;}return;}}
function getOutcome(w){const ours=w.buildings.some(b=>b.team==='player'&&b.kind==='town'&&b.hp>0),theirs=w.buildings.some(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);return !ours?'lost':!theirs?'won':'playing';}
function manageEnemyEconomy(w,dt){
 const settings=aiSettings(w);
 const workers=w.units.filter(u=>u.team==='enemy'&&u.kind==='worker'&&u.hp>0);
 const town=w.buildings.find(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);
 if(!town)return;
 const jobs=['food','wood','gold','food','wood','stone','food','gold','food','wood'];
 for(let i=0;i<workers.length;i++)if(!workers[i].jobKind)workers[i].jobKind=jobs[i%jobs.length];
 if(w.difficulty!=='easy'&&w.time>180){
  const goldWorkers=workers.filter(u=>u.jobKind==='gold').length;
  if(goldWorkers<3&&workers.filter(u=>u.jobKind==='food').length>3&&w.stock.enemy.food>160){
   const miner=workers.find(u=>u.jobKind==='food'&&u.carry===0&&u.order?.type!=='build');
   if(miner){miner.jobKind='gold';miner.order=null;miner.path=[];}
  }
 }
 const goal=settings.workerGoals[Math.min(Math.floor(w.time/230),settings.workerGoals.length-1)];
 w.aiWorkerClock=(w.aiWorkerClock||0)+dt;
 if(w.aiWorkerClock>=settings.workerInterval){
  w.aiWorkerClock=0;
  if(workers.length+town.queue.length<goal&&town.queue.length===0&&population(w,'enemy').used<population(w,'enemy').max)queueUnit(w,town.id,'worker','enemy');
 }
 if(!workers.length)return;
 const planning=w.time>=(w.aiNextPlan||0);
 if(planning)w.aiNextPlan=w.time+settings.thinkInterval;
 let site=w.buildings.find(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0);
 if(planning&&w.time>=settings.barracksDelay&&!site){
  const builder=workers.find(u=>u.jobKind==='wood')||workers[0];
  const result=startConstruction(w,[builder.id],'barracks',w.enemyBarracksSite.x,w.enemyBarracksSite.y,'enemy');
  if(result.ok){site=result.building;w.enemyBarracksStarted=true;}
 }
 if(site&&!site.complete&&!workers.some(u=>u.order?.type==='build'&&u.order.target===site.id)){
  const builder=workers.find(u=>u.jobKind==='wood')||workers[0];
  builder.order={type:'build',target:site.id};setApproach(w,builder,site);
 }
 // One construction per worker; keep the original barracks builder on its site.
 const unfinished=w.buildings.filter(b=>b.team==='enemy'&&!b.complete&&b.hp>0);
 if(planning&&site?.complete&&w.time>=settings.secondBarracksAt&&w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0).length<2&&affordable(w,'enemy',TYPES.barracks.cost)&&!unfinished.some(b=>b.kind==='barracks')){
  const builder=workers.find(u=>u.jobKind==='stone'&&u.order?.type!=='build')||workers.find(u=>u.order?.type!=='build');
  if(builder)for(const radius of [225,265,305]){
   for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.barracks.radius,true))continue;
    if(startConstruction(w,[builder.id],'barracks',x,y,'enemy').ok)break;
   }
   if(w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks').length>=2)break;
  }
 }
 const pop=population(w,'enemy');
 if(planning&&pop.used>=pop.max-2&&!unfinished.some(b=>b.kind==='house')&&affordable(w,'enemy',TYPES.house.cost)){
  const builder=workers.find(u=>u.jobKind==='wood'&&u.order?.type!=='build')||workers.find(u=>u.order?.type!=='build');
  if(builder)for(const radius of [155,190,245,295,350]){
   for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.house.radius,true))continue;
    if(startConstruction(w,[builder.id],'house',x,y,'enemy').ok)break;
   }
   if(w.buildings.some(b=>b.team==='enemy'&&b.kind==='house'&&!b.complete))break;
  }
 }
 for(const building of w.buildings.filter(b=>b.team==='enemy'&&!b.complete&&b.hp>0)){
  if(workers.some(u=>u.order?.type==='build'&&u.order.target===building.id))continue;
  const builder=workers.find(u=>u.order?.type!=='build');
  if(builder){builder.order={type:'build',target:building.id};setApproach(w,builder,building);}
 }
 const stoneGoal=currentAge(w,'enemy')>=2?AGES[3].cost.stone+TYPES.workshop.cost.stone:TYPES.barracks.cost.stone+30;
 if(w.stock.enemy.stone>=stoneGoal){
  for(const u of workers.filter(u=>u.jobKind==='stone'&&u.carry===0&&u.order?.type!=='build')){
   u.jobKind='wood';u.order=null;u.path=[];
  }
 }
 if(w.time>=130&&w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.hp>0).length<2&&w.stock.enemy.stone<TYPES.barracks.cost.stone&&!workers.some(u=>u.jobKind==='stone')){
  const miner=workers.find(u=>u.jobKind==='wood'&&u.carry===0&&u.order?.type!=='build');
  if(miner){miner.jobKind='stone';miner.order=null;miner.path=[];}
 }
 if(currentAge(w,'enemy')>=2&&w.stock.enemy.stone<stoneGoal&&!workers.some(u=>u.jobKind==='stone')){
  const miner=workers.find(u=>u.jobKind==='wood'&&u.carry===0&&u.order?.type!=='build');
  if(miner){miner.jobKind='stone';miner.order=null;miner.path=[];}
 }
 for(const u of workers){
  if(u.order)continue;
  const nodes=w.nodes.filter(n=>n.kind===u.jobKind&&n.amount>0);
  nodes.sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
  for(const node of nodes){if(setDestination(w,u,node.x,node.y)){u.order={type:'gather',target:node.id};break;}}
 }
}
function manageEnemyProgress(w){
 if(w.time<(w.aiNextAgePlan||0))return;
 w.aiNextAgePlan=w.time+aiSettings(w).thinkInterval;
 const team='enemy',age=currentAge(w,team),town=w.buildings.find(b=>b.team===team&&b.kind==='town'&&b.hp>0);
 if(!town)return;
 const barracks=w.buildings.filter(b=>b.team===team&&b.kind==='barracks'&&b.complete&&b.hp>0);
 if(age===1){
  if(w.time>=aiSettings(w).ageDelay&&barracks.length>=2&&(w.difficulty!=='hard'||w.aiWavesSent>0))beginAge(w,town.id,team);
  return;
 }
 const workshops=w.buildings.filter(b=>b.team===team&&b.kind==='workshop'&&b.hp>0);
 if(!workshops.length&&w.time>=260&&barracks.length>=2){
  const worker=w.units.find(u=>u.team===team&&u.kind==='worker'&&u.hp>0&&u.order?.type!=='build');
  if(worker&&affordable(w,team,TYPES.workshop.cost))for(const radius of [210,265,325]){
   for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=town.x+Math.cos(angle)*radius,y=town.y+Math.sin(angle)*radius;
    if(!canBuild(w,x,y,TYPES.workshop.radius,true))continue;
    if(startConstruction(w,[worker.id],'workshop',x,y,team).ok)break;
   }
   if(w.buildings.some(b=>b.team===team&&b.kind==='workshop'))break;
  }
 }
 const shop=workshops.find(b=>b.complete);
 if(age===2&&w.time>=aiSettings(w).ageIIIAt&&w.aiWavesSent>=(aiSettings(w).ageIIIWaves||0)){beginAge(w,town.id,team);return;}
 if(age===3&&w.aiWavesSent<3)return;
 if(age===2&&w.difficulty==='normal'&&w.aiWavesSent<2)return;
 if(!shop||shop.research||w.time<270)return;
 const priorities=age===2?['harvest','forgedBlades']:['reinforcedArmor','vitality','boots','forgedBladesII','harvestII','reinforcedArmorII','vitalityII','bootsII'];
 for(const key of priorities)if(beginResearch(w,shop.id,key,team).ok)break;
}
function waveStage(w){
 const stages=aiSettings(w).waveStages;
 return [...stages].reverse().find(stage=>w.time>=stage.after)||stages[0];
}
function sendRaid(w,u,town,bridgeIndex){
 const [px,py]=AI.bridges[bridgeIndex],bridge={x:px/MAP.imageWidth*MAP.width,y:py/MAP.imageHeight*MAP.height};
 const approach={x:town.x+(TYPES[town.kind].radius||15)+35,y:town.y};
 const first=findPath(w,u,bridge,u),second=findPath(w,bridge,approach,u);
 u.order={type:'attack',target:town.id};u.raidBridge=bridgeIndex;
 if(first.length&&second.length)u.path=[...first,...second];
 else setDestination(w,u,town.x,town.y);
}
function defendEnemyBase(w){
 const settings=aiSettings(w);
 const base=w.buildings.filter(b=>b.team==='enemy'&&b.hp>0);
 const intruders=w.units.filter(u=>u.team==='player'&&u.hp>0&&base.some(b=>Math.hypot(u.x-b.x,u.y-b.y)<TYPES[b.kind].radius+settings.defenseRadius));
 if(intruders.length){
  w.aiThreatUntil=w.time+settings.defenseQuiet;
  const town=base.find(b=>b.kind==='town')||base[0];
  if(currentAge(w,'enemy')>=3&&town.kind==='town'){
   usePower(w,town.id,'storm','enemy');usePower(w,town.id,'healing','enemy');
  }
  const military=w.units.filter(u=>u.team==='enemy'&&['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&u.hp>0);
  military.sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y));
  const defenders=military.filter(u=>Math.hypot(u.x-town.x,u.y-town.y)<=settings.defenderRadius);
  if(!defenders.length&&military.length)defenders.push(military[0]);
  for(const u of defenders.slice(0,Math.min(settings.defenderLimit,Math.max(2,intruders.length*2)))){
   const target=intruders.reduce((closest,other)=>!closest||Math.hypot(other.x-u.x,other.y-u.y)<Math.hypot(closest.x-u.x,closest.y-u.y)?other:closest,null);
   if(!u.defenseOrder)u.defenseOrder=u.resumeOrder||u.order||{type:'hold'};
   u.resumeOrder=null;
   if(u.order?.target!==target.id||u.order?.type!=='attack'){
    u.order={type:'attack',target:target.id};setDestination(w,u,target.x,target.y);
   }
  }
 }
 if(w.time<(w.aiThreatUntil||0))return;
 for(const u of w.units.filter(u=>u.team==='enemy'&&u.defenseOrder)){
  const original=u.defenseOrder;u.defenseOrder=null;u.resumeOrder=null;
  u.order=original.type==='hold'?null:original;
  if(u.raidWave&&u.order?.type==='attack'){
   const town=getEntity(w,u.order.target);
   if(town?.hp>0){sendRaid(w,u,town,u.raidBridge||0);continue;}
  }
  if(u.order?.type==='move')setDestination(w,u,u.order.x,u.order.y);
  else if(u.order?.target){const target=getEntity(w,u.order.target);if(target?.hp>0)setDestination(w,u,target.x,target.y);else u.order=null;}
  else u.path=[];
 }
}
function enemyCanSee(w,entity){
 return [...w.units,...w.buildings].some(observer=>observer.team==='enemy'&&observer.hp>0&&(observer.type!=='building'||observer.complete)&&Math.hypot(observer.x-entity.x,observer.y-entity.y)<=TYPES[observer.kind].visionRadius);
}
function updateEnemyCounters(w){
 if(!aiSettings(w).counterUnits||w.time<(w.aiCounterNext||0))return;
 w.aiCounterNext=w.time+(aiSettings(w).counterInterval||25);
 const known=w.units.filter(u=>u.team==='player'&&u.hp>0&&u.kind!=='worker'&&enemyCanSee(w,u));
 const count=kind=>known.filter(u=>u.kind===kind).length;
 const counters={spearman:count('cavalry')+count('mythic'),cavalry:count('archer'),archer:count('soldier')+count('champion')};
 const strongest=Object.entries(counters).sort((a,b)=>b[1]-a[1])[0];
 // Remember a sighting briefly rather than reacting to every unit immediately.
 if(strongest[1]>=(aiSettings(w).counterThreshold||3))w.aiCounterPreference=strongest[0];
 else if(!known.length&&w.time>(w.aiLastSighting||0)+100)w.aiCounterPreference=null;
 if(known.length)w.aiLastSighting=w.time;
}
function enemyRaidTarget(w,town){
 if(w.difficulty==='easy')return town;
 const seen=w.buildings.filter(b=>b.team==='player'&&b.hp>0&&b.complete&&b.kind==='barracks'&&enemyCanSee(w,b));
 return seen[0]||town;
}
function tickWorld(w,dt){
 if(w.outcome!=='playing')return;
 dt=Math.min(dt,.15);w.time+=dt;tickProgression(w,dt);
 manageEnemyEconomy(w,dt);manageEnemyProgress(w);updateEnemyCounters(w);
 for(const u of [...w.units])tickUnit(w,u,dt);
 tickProjectiles(w,dt);
 w.units=w.units.filter(u=>u.hp>0);
 w.buildings=w.buildings.filter(b=>b.hp>0);
 separateUnits(w);
 defendEnemyBase(w);
 for(const b of w.buildings){
  if(!b.complete||!b.queue.length)continue;
  b.spawnProgress+=dt;
  if(b.spawnProgress>=TYPES[b.queue[0]].time){
   b.spawnProgress=0;
   const kind=b.queue[0],unit=spawnNear(w,b,kind);
   if(unit){b.queue.shift();w.units.push(unit);}else b.spawnProgress=TYPES[kind].time;
  }
 }
 w.aiClock+=dt;w.raidClock+=dt;
 if(w.aiClock>=aiSettings(w).trainInterval){
  w.aiClock=0;
  const barracks=w.buildings.filter(b=>b.team==='enemy'&&b.kind==='barracks'&&b.complete&&b.hp>0);
  const weights=w.time<240?{soldier:3,spearman:2,archer:2,cavalry:1,champion:0,mythic:0}:w.time<500?{soldier:2,spearman:2,archer:2,cavalry:2,champion:0,mythic:0}:{soldier:2,spearman:2,archer:2,cavalry:2,champion:1,mythic:1};
  if(w.aiCounterPreference&&weights[w.aiCounterPreference])weights[w.aiCounterPreference]*=aiSettings(w).counterWeight||1.8;
  for(const b of barracks){
   if(b.queue.length||population(w,'enemy').used>=population(w,'enemy').max)continue;
   const kinds=['soldier','spearman','archer','cavalry','champion'].filter(kind=>unlocked(w,'enemy',kind)&&(w.difficulty!=='easy'||kind==='soldier'||kind==='spearman'||kind==='archer'&&w.time>500));
   const rotation=Object.fromEntries(kinds.map((kind,i)=>[kind,(i-(w.aiTrainingCount||0)%kinds.length+kinds.length)%kinds.length]));
   const counts=Object.fromEntries(kinds.map(kind=>[kind,w.units.filter(u=>u.team==='enemy'&&u.kind===kind&&u.hp>0).length+barracks.reduce((n,site)=>n+site.queue.filter(queued=>queued===kind).length,0)]));
   kinds.sort((a,b)=>counts[a]/weights[a]-counts[b]/weights[b]||rotation[a]-rotation[b]);
   const cavalryDue=unlocked(w,'enemy','cavalry')&&w.time>=240&&counts.cavalry<Math.ceil((counts.soldier+counts.spearman+counts.archer+counts.cavalry)/6);
   const reserveCavalry=cavalryDue&&!w.aiCounterPreference&&(w.stock.enemy.gold<TYPES.cavalry.resourceCost.gold||w.stock.enemy.food<TYPES.cavalry.resourceCost.food);
   const reservingAge=w.time>=aiSettings(w).ageDelay+10&&currentAge(w,'enemy')===1&&(w.difficulty!=='hard'||w.aiWavesSent>0)||w.time>=aiSettings(w).ageIIIAt+10&&currentAge(w,'enemy')===2&&w.aiWavesSent>=(aiSettings(w).ageIIIWaves||0);
   if(reservingAge&&barracks.length>=2)continue;
   for(const kind of kinds){
    if(reserveCavalry&&kind!=='cavalry')continue;
    if(queueUnit(w,b.id,kind,'enemy').ok){w.aiTrainingCount=(w.aiTrainingCount||0)+1;break;}
   }
  }
  if(currentAge(w,'enemy')>=3){
   const shop=w.buildings.find(b=>b.team==='enemy'&&b.kind==='workshop'&&b.complete&&b.hp>0&&!b.research&&!b.queue.length);
   if(shop&&w.units.filter(u=>u.team==='enemy'&&u.kind==='mythic').length<1)queueUnit(w,shop.id,'mythic','enemy');
  }
 }
 if(w.aiWaveActive&&!w.units.some(u=>u.team==='enemy'&&u.raidWave))w.aiWaveActive=false;
 const stage=waveStage(w);
 if(!w.aiWaveActive&&w.time>=(w.aiThreatUntil||0)&&w.raidClock>=stage.cooldown){
  const squad=w.units.filter(u=>u.team==='enemy'&&['soldier','spearman','archer','cavalry','champion','mythic'].includes(u.kind)&&!u.raidWave&&u.hp>0&&!u.defenseOrder);
  const town=w.buildings.find(b=>b.team==='player'&&b.kind==='town'),size=stage.size;
  const secure=w.time>=(w.aiThreatUntil||0)&&w.buildings.some(b=>b.team==='enemy'&&b.kind==='town'&&b.hp>0);
  if(town&&secure&&squad.length>=size){
   w.aiWaveActive=true;w.aiWavesSent++;w.raidClock=0;
   const bridge=(w.aiWavesSent-1)%AI.bridges.length;
   const primary=enemyRaidTarget(w,town);
   const workers=w.units.filter(u=>u.team==='player'&&u.kind==='worker'&&u.hp>0&&enemyCanSee(w,u));
   const secondary=workers[0]||town;
   const flank=aiSettings(w).multiAttack&&size>=14?Math.max(4,Math.floor(size*.25)):0;
   for(const [i,u] of squad.slice(0,size).entries()){
    u.raidWave=true;sendRaid(w,u,i>=size-flank?secondary:primary,i>=size-flank?(bridge+1)%AI.bridges.length:bridge);
   }
  }
 }
 updateVision(w);
 w.outcome=getOutcome(w);
}


// js/sprites.js
// Images are decoration only. Unit sizes, collisions and navigation stay in
// world.js and terrain.js, independent of the artwork and loading order.
const teams={player:'blue',enemy:'red'};
const kinds=['worker','soldier','spearman','archer','cavalry','champion','mythic','town','house','barracks','workshop'];
const spriteAssets=Object.fromEntries(Object.entries(teams).map(([team,color])=>
 [team,Object.fromEntries(kinds.map(kind=>{
  const image=typeof Image==='undefined'?null:new Image();
  const art=kind==='champion'?'soldier':kind==='mythic'?'cavalry':kind;
  const src=`./assets/sprites/${color}-${art}.png`;
  if(image)image.src=src;
  return [kind,{src,image,columns:4,rows:['town','house','barracks','workshop'].includes(kind)?1:4}];
 }))]));

function spriteFrame(unit,time){
 let row=0;
 if(unit.path?.length)row=1;
 else if(unit.order?.type==='attack'||unit.order?.type==='gather'||unit.order?.type==='build')
  row=unit.kind==='worker'&&unit.order.type==='build'?3:2;
 const count=4;
 const column=Math.floor(Math.max(0,time)*((row===1)?6:row>=2?5:2)+unit.id*.83)%count;
 return {row,column};
}

function drawUnitSprite(ctx,unit,time){
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

function drawBuildingSprite(ctx,building,radius){
 const image=spriteAssets[building.team]?.[building.kind]?.image;
 if(!image?.complete||!image.naturalWidth)return false;
 const width=radius*2.45,height=width*image.naturalHeight/image.naturalWidth;
 ctx.save();if(!building.complete)ctx.globalAlpha=.65;
 ctx.drawImage(image,-width/2,-height+radius*.57,width,height);
 ctx.restore();return true;
}


// js/render.js





const ground=['#304644','#354c47','#39534a','#314943'];
let fogCanvas=null,fogPaintedVersion=-1,fogPaintedWorld=null;
function fogLayer(w){
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

function draw(ctx,w,c,ui){const width=c.width,height=c.height;ctx.clearRect(0,0,width,height);const terrainReady=drawTerrain(ctx,c);const tl={x:c.x-width/2/c.zoom,y:c.y-height/2/c.zoom},tile=80;if(!terrainReady)for(let y=Math.floor(tl.y/tile)*tile;y<tl.y+height/c.zoom+tile;y+=tile)for(let x=Math.floor(tl.x/tile)*tile;x<tl.x+width/c.zoom+tile;x+=tile){if(x<0||y<0||x>=MAP.width||y>=MAP.height)continue;const s=worldToScreen(c,x,y);ctx.fillStyle=ground[(Math.abs(Math.floor(x/tile)*13+Math.floor(y/tile)*17))%ground.length];ctx.fillRect(s.x,s.y,tile*c.zoom+1,tile*c.zoom+1);ctx.fillStyle='#ffffff08';ctx.fillRect(s.x,s.y,1,tile*c.zoom);}const a=worldToScreen(c,0,0),b=worldToScreen(c,MAP.width,MAP.height);ctx.strokeStyle='#bb9459';ctx.lineWidth=5;ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
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


// js/main.js










const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),stage=document.querySelector('.stage');
let w=createWorld();
let started=false;
const c={x:540,y:500,zoom:.75,width:800,height:500};
const ui={selected:[],build:null,mouse:{x:0,y:0},drag:null,minimapDrag:false,formation:'compact'};
const keys=new Set(),groups={};
let previous=performance.now(),toastUntil=0;
function resize(){const r=stage.getBoundingClientRect();c.width=r.width;c.height=r.height;const ratio=devicePixelRatio||1;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
window.addEventListener('resize',resize);resize();
function message(s){if(!s)return;const el=document.querySelector('#toast');el.textContent=s;el.classList.add('show');toastUntil=performance.now()+2700;}
const pointer=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
function findAt(p){
 const q=screenToWorld(c,p.x,p.y);
 return [...w.units].reverse().find(u=>isEntityVisible(w,u)&&Math.hypot(u.x-q.x,u.y-q.y)<18)||
  [...w.buildings].reverse().find(b=>isEntityVisible(w,b)&&Math.hypot(b.x-q.x,b.y-q.y)<TYPES[b.kind].radius)||
  w.nodes.find(n=>n.amount>0&&fogAt(w,n.x,n.y)>0&&Math.hypot(n.x-q.x,n.y-q.y)<27);
}
function panMinimap(p){const target=minimapToWorld(c,p.x,p.y);if(!target)return false;c.x=target.x;c.y=target.y;return true;}
canvas.addEventListener('mousedown',e=>{
 if(e.button!==0||w.outcome!=='playing')return;
 const p=pointer(e);
 if(panMinimap(p)){ui.minimapDrag=true;ui.drag=null;return;}
 ui.drag={x:p.x,y:p.y,toX:p.x,toY:p.y};
});
canvas.addEventListener('mousemove',e=>{
 const p=pointer(e);ui.mouse=screenToWorld(c,p.x,p.y);
 if(ui.minimapDrag&&e.buttons&1){panMinimap(p);return;}
 if(ui.drag){ui.drag.toX=p.x;ui.drag.toY=p.y;}
});
window.addEventListener('mouseup',e=>{
 if(ui.minimapDrag){ui.minimapDrag=false;return;}
 if(e.button!==0||!ui.drag)return;
 const d=ui.drag;ui.drag=null;
 const p=pointer(e),q=screenToWorld(c,p.x,p.y);
 if(ui.build){
  if(fogAt(w,q.x,q.y)!==2){message('Explore d’abord cette zone');return;}
  const workers=ui.selected.filter(id=>w.units.some(u=>u.id===id&&u.kind==='worker'));
  const result=startConstruction(w,workers,ui.build,q.x,q.y);
  message(result.ok?LABELS[ui.build]+' : chantier lancé':result.reason);
  if(result.ok)ui.build=null;
  refresh();return;
 }
 if(Math.hypot(d.x-p.x,d.y-p.y)>8)ui.selected=selectRectangle(w,c,{...d,toX:p.x,toY:p.y});
 else{
  const target=findAt(p);
  if(target?.team==='player')ui.selected=e.shiftKey?toggleSelection(ui.selected,target.id):[target.id];
  else if(!e.shiftKey)ui.selected=[];
 }
 refresh();
});
canvas.addEventListener('dblclick',e=>{
 const p=pointer(e);if(pointInMinimap(c,p.x,p.y))return;
 const target=findAt(p);
 if(target?.type!=='unit'||target.team!=='player')return;
 const similar=selectSimilarVisible(w,c,target.kind);
 ui.selected=e.shiftKey?[...new Set([...ui.selected,...similar])]:similar;
 refresh();
});
canvas.addEventListener('contextmenu',e=>{
 e.preventDefault();if(w.outcome!=='playing')return;
 ui.build=null;
 const p=pointer(e),target=findAt(p),q=screenToWorld(c,p.x,p.y);
 if(pointInMinimap(c,p.x,p.y))return;
 let result;
 if(target?.type==='node')result=orderGather(w,ui.selected,target.id);
 else if(target?.team==='enemy')result=orderAttack(w,ui.selected,target.id);
 else if(target?.team==='player'&&target.type==='building'&&!target.complete)result=orderBuild(w,ui.selected,target.id);
 else if(target?.team==='player'&&target.type==='building')result=orderInteract(w,ui.selected,target.id,ui.formation);
 else result=orderMove(w,ui.selected,q.x,q.y,ui.formation);
 if(!result.ok)message(result.reason);
 refresh();
});
canvas.addEventListener('wheel',e=>{
 e.preventDefault();const p=pointer(e),before=screenToWorld(c,p.x,p.y);
 c.zoom=Math.max(.45,Math.min(1.7,c.zoom*(e.deltaY>0?.9:1.1)));
 const after=screenToWorld(c,p.x,p.y);c.x+=before.x-after.x;c.y+=before.y-after.y;
},{passive:false});
window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
 if(/^[1-9]$/.test(e.key)){
  e.preventDefault();if(e.repeat)return;
  if(e.ctrlKey){storeControlGroup(groups,Number(e.key),ui.selected,w);message('Groupe '+e.key+' enregistré');}
  else{ui.selected=recallControlGroup(groups,Number(e.key),w);refresh();}
  return;
 }
 if(!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='f'){ui.formation='compact';refresh();}
 if(!e.ctrlKey&&!e.altKey&&e.key.toLowerCase()==='l'){ui.formation='line';refresh();}
 keys.add(e.key.toLowerCase());
 if(e.key==='Escape'){ui.build=null;refresh();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.querySelector('#help').onclick=()=>document.querySelector('#help-panel').hidden=false;
document.querySelector('#close-help').onclick=()=>document.querySelector('#help-panel').hidden=true;
document.querySelector('#restart').onclick=()=>{document.querySelector('#banner').hidden=true;document.querySelector('#start-menu').hidden=false;started=false;};
document.querySelectorAll('[data-difficulty]').forEach(el=>el.onclick=()=>{
 const difficulty=el.dataset.difficulty;
 w=createWorld(difficulty);started=true;ui.selected=[];ui.build=null;ui.formation='compact';
 for(const key of Object.keys(groups))delete groups[key];
 c.x=540;c.y=500;c.zoom=.75;previous=performance.now();
 document.querySelector('#start-menu').hidden=true;document.querySelector('#banner').hidden=true;refresh();
});
function button(title,cost,action,execute=null){
 const el=document.createElement('button');el.className='action'+(ui.build===action?' active':'');
 el.innerHTML=title+(cost?'<small>'+Object.entries(cost).map(([k,v])=>v+' '+LABELS[k]).join(' · ')+'</small>':'');
 el.onclick=()=>{
  if(execute){const result=execute();message(result.ok?'Commande lancée':result.reason);}
  else if(['house','barracks','workshop'].includes(action)){ui.build=action;message('Choisis un emplacement sur la carte');}
  else{const result=queueUnit(w,ui.selected[0],action);message(result.ok?'Unité en formation':result.reason);}
  refresh();
 };return el;
}
function formationButton(kind,label){
 const el=document.createElement('button');el.className='action'+(ui.formation===kind?' active':'');
 el.textContent=label;el.onclick=()=>{ui.formation=kind;refresh();};return el;
}
function refresh(){
 const stock=w.stock.player,pop=population(w,'player'),age=currentAge(w,'player');
 document.querySelector('#difficulty-status').textContent=`IA : ${AI_DIFFICULTIES[w.difficulty].label}`;
 document.querySelector('#resources').innerHTML=`<div class="resource"><span>Époque</span><b>⌛ ${AGES[age].label}</b></div><div class="resource"><span>🌾 Nourriture</span><b>🌾 ${Math.floor(stock.food)}</b></div><div class="resource"><span>🌲 Bois</span><b>🌲 ${Math.floor(stock.wood)}</b></div><div class="resource"><span>✦ Or</span><b>✦ ${Math.floor(stock.gold)}</b></div><div class="resource"><span>Pierre</span><b>🪨 ${Math.floor(stock.stone)}</b></div><div class="resource"><span>Population</span><b>♟ ${pop.used}/${pop.max}</b></div>`;
 const selected=ui.selected.map(id=>getEntity(w,id)).filter(Boolean),info=document.querySelector('#selection'),actions=document.querySelector('#actions');
 actions.replaceChildren();
 if(!selected.length){info.textContent='Sélectionne tes ouvriers pour commencer.';return;}
 const e=selected[0];
 const research=e.research,task=research&&(research.type==='age'?AGES[research.key]:TECHNOLOGIES[research.key]);
 info.innerHTML=selected.length>1?`<b>${selected.length} unités</b><br>Formation : ${ui.formation==='line'?'en ligne':'compacte'}`:`<b>${LABELS[e.kind]}</b> · ${e.team==='player'?'Aube':'Crépuscule'}<br>Vie : ${Math.max(0,Math.ceil(e.hp))} / ${e.maxHp} <span class="hp"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></span>${e.type==='unit'?`<br>Attaque : ${Math.round(statValue(w,e.team,e.kind,'damage'))} · Armure : ${Math.round(statValue(w,e.team,e.kind,'armor'))} · Portée : ${TYPES[e.kind].attackRange} · Cadence : ${TYPES[e.kind].attackSpeed}s · Vitesse : ${Math.round(statValue(w,e.team,e.kind,'movementSpeed'))} · Population : ${TYPES[e.kind].populationCost}`:''}${e.queue?.length?`<br>En formation : ${e.queue.map(k=>LABELS[k]).join(', ')}`:''}${task?`<br>${task.label} : ${Math.min(100,Math.floor(research.progress/task.time*100))} %`:''}`;
 if(selected.some(x=>x.kind==='worker')){
  actions.append(button('⌂ Maison',TYPES.house.cost,'house'),button('⚒ Caserne',TYPES.barracks.cost,'barracks'));
  if(age>=2)actions.append(button('⚙ Atelier',TYPES.workshop.cost,'workshop'));
 }
 if(selected.length===1&&e.kind==='town'&&e.team==='player'){
  actions.append(button('♟ Former un ouvrier',TYPES.worker.cost,'worker'));
  if(age<3)actions.append(button(`⌛ Passer à l’${AGES[age+1].label}`,AGES[age+1].cost,'age',()=>beginAge(w,e.id)));
  if(age>=3)for(const [key,power] of Object.entries(POWERS))actions.append(button(`✧ ${power.label}`,power.cost,key,()=>usePower(w,e.id,key)));
 }
 if(selected.length===1&&e.kind==='barracks'&&e.complete){
  for(const [kind,title] of [['soldier','⚔ Fantassin'],['spearman','♠ Lancier'],['archer','🏹 Archer'],['cavalry','♞ Cavalier'],['champion','⚜ Champion']])
   if(age>=(kind==='archer'||kind==='cavalry'?2:kind==='champion'?3:1))actions.append(button(title,TYPES[kind].cost,kind));
 }
 if(selected.length===1&&e.kind==='workshop'&&e.complete){
  if(age>=3)actions.append(button('✦ Gardien mythique',TYPES.mythic.cost,'mythic'));
  for(const [key,tech] of Object.entries(TECHNOLOGIES))
   if(age>=tech.age&&!w.progression.player.techs.includes(key)&&(!tech.requires||w.progression.player.techs.includes(tech.requires)))
    actions.append(button(`⚙ ${tech.label}`,tech.cost,key,()=>beginResearch(w,e.id,key)));
 }
 if(selected.filter(x=>x.type==='unit').length>1)actions.append(formationButton('compact','◆ Compacte'),formationButton('line','▬ En ligne'));
}
function loop(now){
 const dt=Math.min((now-previous)/1000,.05);previous=now;
 if(started&&w.outcome==='playing'){
  const px=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('q')||keys.has('a')||keys.has('arrowleft')?1:0);
  const py=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('z')||keys.has('w')||keys.has('arrowup')?1:0);
  c.x=Math.max(0,Math.min(MAP.width,c.x+px*440*dt/c.zoom));c.y=Math.max(0,Math.min(MAP.height,c.y+py*440*dt/c.zoom));
  tickWorld(w,dt);
  if(w.outcome!=='playing'){
   document.querySelector('#result').textContent=w.outcome==='won'?'Victoire de l’Aube':'Le Crépuscule l’emporte';
   document.querySelector('#result-text').textContent=w.outcome==='won'?'Le sanctuaire adverse est tombé.':'Ton sanctuaire a été détruit.';
   document.querySelector('#banner').hidden=false;
  }
 }
 if(now>toastUntil)document.querySelector('#toast').classList.remove('show');
 if(!loop.lastRefresh||now-loop.lastRefresh>350){ui.selected=ui.selected.filter(id=>getEntity(w,id));refresh();loop.lastRefresh=now;}
 draw(ctx,w,c,ui);requestAnimationFrame(loop);
}
refresh();requestAnimationFrame(loop);

})();
