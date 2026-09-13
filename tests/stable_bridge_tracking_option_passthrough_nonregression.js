const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

const det=(x,score=.95)=>({cat:'team',x,y:.50,score,feature:[.25,.25,.25]});
const byX=rows=>new Map(rows.map(row=>[row.x,row.trackId]));

function crossing(extra={}){
  const bridge=Bridge.create({baseThreshold:.90,longGapSeconds:999,...extra});
  const first=bridge.processFrame([det(.30),det(.70)],0,{});
  const ids=byX(first);
  bridge.processFrame([det(.40),det(.60)],1,{});
  const third=bridge.processFrame([det(.39),det(.61)],2,{});
  return {bridge,ids,cross:byX(third)};
}

const legacy=crossing();
assert.strictEqual(legacy.cross.get(.39),legacy.ids.get(.30),'bridge legacy: association spatiale historique inchangée sans option');
assert.strictEqual(legacy.cross.get(.61),legacy.ids.get(.70),'bridge legacy: second ID historique inchangé sans option');

const guarded=crossing({directionConsistencyEnabled:true,directionPenaltyWeight:.18,directionMinMotion:.003});
assert.strictEqual(guarded.cross.get(.39),guarded.ids.get(.70),'bridge transmet la cohérence directionnelle: joueur venant de droite continue vers la gauche');
assert.strictEqual(guarded.cross.get(.61),guarded.ids.get(.30),'bridge transmet la cohérence directionnelle: joueur venant de gauche continue vers la droite');

const contextual=Bridge.create({baseThreshold:.90,longGapSeconds:999,directionConsistencyEnabled:true,directionPenaltyWeight:.18,directionMinMotion:.003});
const contextualFirst=byX(contextual.processFrame([det(.30),det(.70)],0,{}));
contextual.processFrame([det(.40),det(.60)],1,{});
const disabledAtFrame=byX(contextual.processFrame([det(.39),det(.61)],2,{directionConsistencyEnabled:false}));
assert.strictEqual(disabledAtFrame.get(.39),contextualFirst.get(.30),'un contexte frame peut désactiver explicitement le garde pour benchmark A/B');
assert.strictEqual(disabledAtFrame.get(.61),contextualFirst.get(.70),'override frame désactivé reste déterministe');

const gallery=Bridge.create({baseThreshold:.90,longGapSeconds:999,reidGalleryMaxSamples:3,appearanceUpdateMinScore:.99});
gallery.processFrame([det(.20,.95)],0,{});
for(let i=1;i<=5;i++)gallery.processFrame([det(.20+i*.005,.95)],i,{});
const track=gallery.state.active[0];
assert(track,'piste active attendue');
assert.strictEqual(track.appearanceGallery.length,3,'reidGalleryMaxSamples create-level atteint le cœur via le bridge');
assert(track.appearanceUpdatesRejectedLowScore>=5,'appearanceUpdateMinScore create-level atteint le cœur via le bridge');

console.log('PASS STABLE bridge advanced tracking option passthrough: direction A/B 2 reversals -> 0 when enabled; frame override preserved; ReID gallery cap/update guard propagated');
