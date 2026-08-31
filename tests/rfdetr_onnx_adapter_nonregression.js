'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const sandbox={console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','rfdetr_onnx_adapter_v1.js'),'utf8'),sandbox);
const A=sandbox.CAYRFDETRONNXAdapter;assert.ok(A&&typeof A.decode==='function');
const boxes={dims:[1,3,4],data:new Float32Array([.50,.50,.20,.40,.20,.30,.10,.20,.80,.70,.08,.12])};
const logits={dims:[1,3,3],data:new Float32Array([4,-2,-4,-5,3,-4,2,-3,-4])};
const out=A.decode({dets:boxes,labels:logits},{width:640,height:360,threshold:.5,personClassId:0,maxBoxes:10});
assert.strictEqual(out.length,2,'two person queries retained');
assert.ok(out[0].score>out[1].score,'detections sorted by confidence');
assert.strictEqual(out[0].source,'rfdetr_onnx');
assert.ok(Math.abs(out[0].x-256)<.01&&Math.abs(out[0].y-108)<.01,'cxcywh mapped to pixel xywh');
assert.throws(()=>A.decode({foo:{dims:[1,2,4],data:new Float32Array(8)}},{width:640,height:360}),/RFDETR_OUTPUT/);
assert.throws(()=>A.decode({dets:boxes,labels:logits},{width:0,height:360}),/FRAME_SIZE/);
const named=A.decode({pred_boxes:boxes,pred_logits:logits},{width:640,height:360,threshold:.95,personClassId:0});
assert.strictEqual(named.length,1,'alternate canonical output names supported');

const footballLogits={dims:[1,3,4],data:new Float32Array([
  5,-5,-5,-5,
  -5,3,4,-4,
  -5,5,2,4
])};
const multi=A.decode({dets:boxes,labels:footballLogits},{width:640,height:360,threshold:.8,personClassIds:[1,2,3]});
assert.strictEqual(multi.length,2,'football profile can retain several people classes while excluding ball');
assert.strictEqual(multi[0].classId,1,'best configured people class is preserved');
assert.strictEqual(multi[1].classId,2,'per-query best class avoids duplicate boxes for multi-class people profiles');
assert.throws(()=>A.decode({dets:boxes,labels:footballLogits},{width:640,height:360,personClassIds:[9]}),/PERSON_CLASS_OUT_OF_RANGE/);

console.log('RF-DETR ONNX adapter non-regression: PASS');
