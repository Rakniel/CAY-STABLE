'use strict';
const assert=require('assert');
const Core=require('../tracking_core_v1.js');

function det(feature,x=.5,y=.5,score=.95){return {x,y,score,cat:'team',feature:[feature]};}

// Build a track that has been seen under two substantially different visual conditions.
const state=Core.createState();
const opts={maxPlayers:11,lostAfter:8,reidentifyArchived:true,reidAppearanceThreshold:.10,reidScoreThreshold:.75,reidGalleryMinSamples:3};
for(const [time,feature] of [[0,.20],[1,.21],[2,.19],[3,0],[4,.01],[5,-.01]]){
  const assigned=Core.assignFrame(state,[det(feature)],time,opts);
  assert.strictEqual(assigned.length,1);
  assert.strictEqual(assigned[0].trackId,1);
}
const track=state.active[0];
assert.ok(track);
assert.strictEqual(track.appearanceGallery.length,6,'quality-gated gallery should retain accepted historical appearances');
const emaOnly=Core.appearanceDistance(track.feature,[.20]);
const gallery=Core.galleryAppearanceDistance(track,[.20],opts);
assert.ok(gallery<emaOnly,'historical gallery must improve a viewpoint that EMA has partially forgotten');
assert.ok(gallery<.04,`gallery distance should remain strong enough for ReID, got ${gallery}`);

// A camera cut archives the player; the return is spatially unrelated, so identity must
// be defended by appearance history rather than stale image coordinates.
Core.startSegment(state,'camera_cut');
assert.strictEqual(state.active.length,0);
assert.strictEqual(state.archive.length,1);
const returned=Core.assignFrame(state,[det(.20,.18,.72,.98)],20,opts);
assert.strictEqual(returned.length,1);
assert.strictEqual(returned[0].trackId,1,'same global ID must be recovered after the cut');
assert.strictEqual(state.created,1,'ReID must not create a duplicate player ID');
assert.strictEqual(state.reidentified,1);
assert.strictEqual(returned[0].track.lastReidEvidence.appearanceModel,'EMA_PLUS_GALLERY');
assert.ok(returned[0].track.lastReidEvidence.gallerySamples>=6);

// Low-confidence crops are intentionally excluded from both EMA and the gallery.
const before=returned[0].track.appearanceGallery.length;
Core.updateTrackAppearance(returned[0].track,[.95],.20,opts);
assert.strictEqual(returned[0].track.appearanceGallery.length,before);
assert.ok(returned[0].track.appearanceUpdatesRejectedLowScore>=1);

console.log('reid appearance gallery non-regression: OK');
