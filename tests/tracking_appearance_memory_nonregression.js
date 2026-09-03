'use strict';
const assert=require('assert');
const core=require('../tracking_core_v1.js');

function det(feature,score=.95,x=.50,y=.50){return {cat:'team',feature,score,x,y};}

const opts={
  maxPlayers:11,
  lostAfter:0,
  reidentifyArchived:true,
  minSameSegmentReidGap:0,
  maxReidGap:30,
  reidAppearanceThreshold:.10,
  reidScoreThreshold:.60,
  reidScoreUniquenessMargin:.035,
  appearanceSmoothingAlpha:.90,
  appearanceUpdateMinScore:.50
};

const state=core.createState();
let out=core.assignFrame(state,[det([0,0])],0,opts);
assert.strictEqual(out.length,1);
assert.strictEqual(out[0].trackId,1);

// A single atypical but still matchable crop must not replace the complete appearance memory.
out=core.assignFrame(state,[det([.20,.20],.95,.50,.50)],1,opts);
assert.strictEqual(out[0].trackId,1);
assert.ok(core.appearanceDistance(out[0].track.feature,[0,0])<.03,'EMA should keep appearance close to stable history');

// Force the track into archive, then re-enter close to the original appearance.
core.assignFrame(state,[],2,opts);
assert.strictEqual(state.active.length,0);
assert.strictEqual(state.archive.length,1);
out=core.assignFrame(state,[det([0,0],.95,.55,.50)],4,opts);
assert.strictEqual(out.length,1);
assert.strictEqual(out[0].trackId,1,'re-entry must recover the original global ID');
assert.strictEqual(state.reidentified,1);
assert.strictEqual(state.created,1,'no replacement ID should be created');
assert.strictEqual(out[0].track.lastReidEvidence.appearanceModel,'EMA_PLUS_GALLERY');
assert.ok(out[0].track.lastReidEvidence.gallerySamples>=3);

// Low-confidence appearance may support position continuity, but must not poison identity memory.
const before=[...out[0].track.feature];
const galleryBefore=out[0].track.appearanceGallery.length;
core.assignFrame(state,[det([.90,.90],.20,.55,.50)],5,{...opts,baseThreshold:1.2});
assert.deepStrictEqual(out[0].track.feature,before);
assert.strictEqual(out[0].track.appearanceGallery.length,galleryBefore);
assert.ok(out[0].track.appearanceUpdatesRejectedLowScore>=1);

const summary=core.summary(state);
assert.strictEqual(summary.tracks[0].appearanceModel,'EMA_PLUS_GALLERY');
assert.ok(summary.tracks[0].appearanceGallerySamples>=3);
assert.ok(summary.tracks[0].appearanceUpdates>=3);
console.log('tracking appearance memory non-regression: PASS');
