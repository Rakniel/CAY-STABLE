'use strict';
const assert=require('assert');
const Core=require('../tracking_core_v1.js');

const state=Core.createState();
let assigned=Core.assignFrame(state,[{
  x:.40,y:.80,score:.91,cat:'team',feature:[.1,.2,.3],
  anchorKind:'bbox_bottom_center',sourceTrackId:42
}],0,{maxPlayers:11});
assert.strictEqual(assigned.length,1);
let track=assigned[0].track;
assert.strictEqual(track.fullPath.length,1);
assert.strictEqual(track.fullPath[0].anchorKind,'bbox_bottom_center');
assert.strictEqual(track.fullPath[0].sourceTrackId,42);
assert.strictEqual(track.fullPath[0].detectionScore,.91);

assigned=Core.assignFrame(state,[{
  x:.405,y:.805,score:.88,cat:'team',feature:[.1,.2,.3],
  anchorKind:'bbox_bottom_center',sourceTrackId:42
}],.04,{maxPlayers:11,baseThreshold:1});
assert.strictEqual(assigned.length,1);
track=assigned[0].track;
assert.strictEqual(track.fullPath.length,2);
assert.strictEqual(track.fullPath[1].anchorKind,'bbox_bottom_center');
assert.strictEqual(track.fullPath[1].sourceTrackId,42);
assert.strictEqual(track.fullPath[1].detectionScore,.88);

const legacy=Core.createState();
const legacyAssigned=Core.assignFrame(legacy,[{x:.2,y:.3,score:.7,cat:'team',feature:[.2,.3]}],0,{maxPlayers:11});
assert.strictEqual(legacyAssigned.length,1);
const legacyPoint=legacyAssigned[0].track.fullPath[0];
assert.strictEqual(Object.prototype.hasOwnProperty.call(legacyPoint,'anchorKind'),false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(legacyPoint,'sourceTrackId'),false);
assert.strictEqual(legacyPoint.detectionScore,.7);

console.log('tracking_metric_anchor_provenance_nonregression: PASS');
