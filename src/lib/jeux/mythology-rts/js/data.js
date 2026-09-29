export const MAP={width:3000,height:2250,cell:40,imageWidth:1448,imageHeight:1086};
// The soldier id remains for compatibility with existing games: it is the infantry role.
export const COMBAT={counterMultiplier:1.2,counters:{spearman:'cavalry',cavalry:'archer',archer:'soldier'},projectileSpeed:250,projectileMaxDistance:190,acquisitionRadius:165};
export const TYPES={
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
export const LABELS={worker:'Ouvrier',soldier:'Fantassin',spearman:'Lancier',archer:'Archer',cavalry:'Cavalier',champion:'Champion',mythic:'Gardien mythique',town:'Sanctuaire',house:'Maison',barracks:'Caserne',workshop:'Atelier',wood:'Bois',food:'Nourriture',gold:'Or',stone:'Pierre'};

export const AGES={
 1:{label:'Âge I',cost:{},time:0},
 2:{label:'Âge II',cost:{food:280,wood:190,gold:170},time:25},
 3:{label:'Âge III',cost:{food:480,wood:300,gold:310,stone:120},time:42}
};
export const UNLOCK_AGE={worker:1,house:1,barracks:1,soldier:1,spearman:1,
 archer:2,cavalry:2,workshop:2,champion:3,mythic:3};
// A single registry drives costs, prerequisites, durations and stat changes.
export const TECHNOLOGIES={
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
export const POWERS={
 healing:{label:'Bénédiction astrale',age:3,cost:{food:85,gold:75},cooldown:65,radius:290,heal:50},
 storm:{label:'Tempête astrale',age:3,cost:{gold:110,stone:50},cooldown:85,radius:420,blastRadius:95,damage:55}
};

export const AI={
 barracksDelay:35,trainEvery:9,workerTrainEvery:13,workerGoals:[6,8,10],
 waveStages:[{after:0,size:6,cooldown:90},{after:240,size:11,cooldown:110},{after:500,size:20,cooldown:135}],
 defenseRadius:310,defenderRadius:680,defenseQuiet:8,
 // Pixel positions on the 1448 × 1086 map; the physics still use terrain.js.
 bridges:[[1090,410],[1090,760]]
};
// Difficulty changes decisions and pacing only. Unit stats, costs and starting stock are shared.
export const AI_DIFFICULTIES={
 easy:{label:'Simple',thinkInterval:3.2,workerInterval:18,workerGoals:[5,6,7],barracksDelay:58,secondBarracksAt:320,ageDelay:310,ageIIIAt:650,trainInterval:12,waveStages:[{after:0,size:6,cooldown:315},{after:450,size:8,cooldown:165},{after:800,size:10,cooldown:155}],defenseRadius:245,defenderRadius:460,defenseQuiet:14,defenderLimit:3,counterUnits:false,multiAttack:false,economicBonus:0},
 normal:{label:'Normal',thinkInterval:1.6,workerInterval:11,workerGoals:[6,9,13],barracksDelay:AI.barracksDelay,secondBarracksAt:150,ageDelay:260,ageIIIAt:550,ageIIIWaves:3,trainInterval:7.5,waveStages:[{after:0,size:10,cooldown:245},{after:300,size:14,cooldown:95},{after:620,size:16,cooldown:95},{after:1100,size:18,cooldown:105}],defenseRadius:AI.defenseRadius+45,defenderRadius:AI.defenderRadius,defenseQuiet:AI.defenseQuiet,defenderLimit:7,counterUnits:true,counterThreshold:4,counterWeight:1.35,counterInterval:30,multiAttack:false,economicBonus:0},
 hard:{label:'Difficile',thinkInterval:1,workerInterval:9,workerGoals:[7,10,16],barracksDelay:35,secondBarracksAt:145,ageDelay:200,ageIIIAt:550,ageIIIWaves:3,trainInterval:6.5,waveStages:[{after:0,size:14,cooldown:95},{after:560,size:18,cooldown:85},{after:1000,size:20,cooldown:75},{after:1500,size:24,cooldown:75}],defenseRadius:400,defenderRadius:850,defenseQuiet:5,defenderLimit:9,counterUnits:true,counterThreshold:3,counterWeight:1.8,counterInterval:25,multiAttack:true,economicBonus:0}
};
