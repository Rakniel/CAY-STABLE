'use strict';
const assert=require('assert');
const Core=require('../tracking_core_v1.js');

function det(feature,x=.5,y=.5,score=.95){return {x,y,score,cat:'team',feature:[feature]};}

// Build one persistent active track under two visual regimes. The old EMA-only
// association eventually forgets the early appearance, while the quality-gated
// gallery intentionally retains it.
const state=Core.createState();
const historyOpts={
  maxPlayers:11,
  lostAfter:8,
  reidGalleryMinSamples:3,
  reidGalleryMaxSamples:48,
  reidGalleryEmaWeight:.35,
  baseThreshold:.50
};

for(const [time,feature] of [[0,.20],[1,.20],[2,.20]]){
  const assigned=Core.assignFrame(state,[det(feature)],time,historyOpts);
  assert.strictEqual(assigned[0].trackId,1);
}
for(let time=3;time<=32;time++){
  const assigned=Core.assignFrame(state,[det(0)],time,historyOpts);
  assert.strictEqual(assigned[0].trackId,1);
}

const track=state.active[0];
assert.ok(track);
assert.strictEqual(state.created,1);
assert.ok(track.appearanceGallery.length>=33);

// At the next frame spatial evidence is neutral. With a deliberately strict
// active-association threshold, EMA-only appearance would fall outside the gate,
// creating a duplicate ID. EMA+gallery remains inside it.
const returnDetection=det(.20);
const strictOpts={...historyOpts,baseThreshold:.05};
const effectiveThreshold=.05+.045; // dt=1 => existing adaptive association gate.
const emaOnlyCost=Core.appearanceDistance(track.feature,returnDetection.feature)*.60;
const galleryCost=Core.matchCost(track,returnDetection,33,strictOpts);

assert.ok(emaOnlyCost>effectiveThreshold,
  `fixture must reproduce the former EMA-only miss: ${emaOnlyCost} <= ${effectiveThreshold}`);
assert.ok(galleryCost<effectiveThreshold,
  `gallery-aware active cost must stay matchable: ${galleryCost} >= ${effectiveThreshold}`);
assert.ok(galleryCost<emaOnlyCost*.5,
  `gallery memory should cut this appearance cost by >50%: ${galleryCost} vs ${emaOnlyCost}`);

const returned=Core.assignFrame(state,[returnDetection],33,strictOpts);
assert.strictEqual(returned.length,1);
assert.strictEqual(returned[0].trackId,1,'active association must keep the persistent global ID');
assert.strictEqual(state.created,1,'active gallery association must avoid a duplicate technical ID');
assert.strictEqual(state.reidentified,0,'this is active association, not archived-track ReID');

console.log(JSON.stringify({
  test:'tracking active gallery association non-regression',
  emaOnlyCost:+emaOnlyCost.toFixed(6),
  galleryAwareCost:+galleryCost.toFixed(6),
  reductionPercent:+((1-galleryCost/emaOnlyCost)*100).toFixed(2),
  persistentTrackId:returned[0].trackId,
  createdTracks:state.created
}));
