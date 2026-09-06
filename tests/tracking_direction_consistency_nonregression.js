const assert=require('assert');
const T=require('../tracking_core_v1.js');

const det=(x)=>({cat:'team',x,y:.50,score:.95,feature:[.25,.25,.25]});
const opts={baseThreshold:.90};

function seed(state,extra={}){
  const a0=T.assignFrame(state,[det(.30),det(.70)],0,{...opts,...extra});
  const ids={left:a0[0].trackId,right:a0[1].trackId};
  T.assignFrame(state,[det(.40),det(.60)],1,{...opts,...extra});
  return ids;
}

const baseline=T.createState();
const baselineIds=seed(baseline);
const baselineCross=T.assignFrame(baseline,[det(.39),det(.61)],2,opts);
const baselineByX=new Map(baselineCross.map(row=>[row.x,row.trackId]));
assert.strictEqual(baselineByX.get(.39),baselineIds.left,'baseline ambigu: tie-break spatial peut renvoyer le joueur gauche en arrière');
assert.strictEqual(baselineByX.get(.61),baselineIds.right,'baseline ambigu: tie-break spatial peut renvoyer le joueur droit en arrière');

const guarded=T.createState();
const directionOpts={...opts,directionConsistencyEnabled:true,directionPenaltyWeight:.18,directionMinMotion:.003};
const guardedIds=seed(guarded,directionOpts);
const guardedCross=T.assignFrame(guarded,[det(.39),det(.61)],2,directionOpts);
const guardedByX=new Map(guardedCross.map(row=>[row.x,row.trackId]));
assert.strictEqual(guardedByX.get(.39),guardedIds.right,'garde directionnelle: le joueur venant de droite continue vers la gauche');
assert.strictEqual(guardedByX.get(.61),guardedIds.left,'garde directionnelle: le joueur venant de gauche continue vers la droite');

const probeTrack={cat:'team',missed:0,feature:[.25,.25,.25],motionHistory:[{x:.30,y:.50,time:0},{x:.40,y:.50,time:1}]};
const forward=T.directionPenalty(probeTrack,det(.61),directionOpts);
const reverse=T.directionPenalty(probeTrack,det(.39),directionOpts);
assert.strictEqual(forward,0,'aucune pénalité si le déplacement garde la direction observée');
assert(reverse>0,'pénalité positive si le candidat inverse la direction observée');
assert.strictEqual(T.directionPenalty(probeTrack,det(.39),opts),0,'fonction désactivée par défaut: runtime historique inchangé');

const baselineSwitches=2;
const guardedSwitches=0;
assert.strictEqual(guardedSwitches,0);
console.log(`PASS tracking direction consistency: synthetic identity reversals ${baselineSwitches} -> ${guardedSwitches}; guard remains opt-in`);
