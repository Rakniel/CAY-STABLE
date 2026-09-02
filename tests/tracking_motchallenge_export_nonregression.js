'use strict';
const assert=require('assert');
const MOT=require('../tracking_motchallenge_export_v1.js');

const frame=MOT.exportFrame([
  {trackId:7,b:{x:100,y:50,w:40,h:80},score:.83,onField:true},
  {trackId:2,box:{x1:10,y1:20,x2:30,y2:70},score:.91,onField:true},
  {trackId:9,b:{x:500,y:300,w:40,h:80},score:.7,isBench:true},
  {trackId:10,b:{x:300,y:200,w:40,h:80},score:.7,yellowDetailOnly:true}
],12,{width:640,height:360});
assert.equal(frame.accepted,2);
assert.equal(frame.rejected,2);
assert.equal(frame.rejectedByReason.cay_identity_guard_rejected,2);
assert.deepStrictEqual(frame.rows[0],[12,2,10,20,20,50,.91,-1,-1,-1]);
assert.deepStrictEqual(frame.rows[1],[12,7,100,50,40,80,.83,-1,-1,-1]);

const clipped=MOT.assignmentToRow({trackId:3,b:{x:-10,y:-5,w:30,h:20},score:2},1,{width:100,height:100});
assert.equal(clipped.accepted,true);
assert.deepStrictEqual(clipped.row,[1,3,0,0,20,15,1,-1,-1,-1]);

const normalized=MOT.assignmentToRow({trackId:4,x:.5,y:.8,normalizedW:.1,normalizedH:.2,score:.5},2,{width:1000,height:500});
assert.equal(normalized.accepted,true);
assert.deepStrictEqual(normalized.row,[2,4,450,300,100,100,.5,-1,-1,-1]);
assert.equal(normalized.boxSource,'NORMALIZED_FOOT_ANCHOR');

assert.equal(MOT.assignmentToRow({trackId:1,b:{x:0,y:0,w:10,h:10}},0,{}).reason,'invalid_frame_index');
assert.equal(MOT.assignmentToRow({b:{x:0,y:0,w:10,h:10}},1,{}).reason,'missing_track_id');
assert.equal(MOT.assignmentToRow({trackId:1,x:.2,y:.3},1,{width:100,height:100}).reason,'missing_pixel_box');

const recorder=MOT.createRecorder({width:640,height:360});
recorder.record([{trackId:1,b:{x:1,y:2,w:3,h:4},score:.75}],1);
recorder.record([{trackId:1,b:{x:2,y:3,w:3,h:4},score:.8},{trackId:2,b:{x:5,y:6,w:7,h:8},score:.9}],2);
const summary=recorder.summary();
assert.equal(summary.frames,2);
assert.equal(summary.rows,3);
assert.equal(summary.benchmarkOnly,true);
assert.equal(summary.coordinateSystem,'IMAGE_PIXELS');
assert.equal(recorder.toText(),'1,1,1,2,3,4,0.75,-1,-1,-1\n2,1,2,3,3,4,0.8,-1,-1,-1\n2,2,5,6,7,8,0.9,-1,-1,-1\n');

console.log('tracking_motchallenge_export_nonregression: OK');
