'use strict';
const assert=require('assert');
const Export=require('../tracking_trackeval_export_v1.js');

const box=(left,top,width,height)=>({left,top,width,height});
const frames=[
  {frame:1,assignments:[
    {trackId:7,sourceTrackId:101,cat:'team',score:.91,bboxPx:box(100,50,40,120)},
    {trackId:8,sourceTrackId:102,cat:'goalkeeper',score:.88,bboxPx:box(300,60,42,118)},
    {trackId:99,cat:'ball',score:.9,bboxPx:box(400,200,12,12)}
  ]},
  {frame:2,assignments:[
    {trackId:7,sourceTrackId:101,cat:'team',score:.93,bboxPx:box(104,50,40,120)}
  ]}
];

const out=Export.exportMOT(frames);
assert.strictEqual(out.version,Export.VERSION);
assert.strictEqual(out.status,'DISPONIBLE');
assert.strictEqual(out.format,'MOTCHALLENGE_10_COLUMN');
assert.strictEqual(out.summary.exportedRows,3,'only CAY person tracks should be exported');
assert.strictEqual(out.summary.bboxEvidenceCoverage,1);
assert.deepStrictEqual(out.rows[0],[1,7,100,50,40,120,.91,-1,-1,-1]);
assert.deepStrictEqual(out.rows[1],[1,8,300,60,42,118,.88,-1,-1,-1]);
assert.deepStrictEqual(out.rows[2],[2,7,104,50,40,120,.93,-1,-1,-1]);
assert.strictEqual(out.text,'1,7,100,50,40,120,0.91,-1,-1,-1\n1,8,300,60,42,118,0.88,-1,-1,-1\n2,7,104,50,40,120,0.93,-1,-1,-1');
assert.strictEqual(out.reference.project,'JonathonLuiten/TrackEval');
assert.strictEqual(out.reference.license,'MIT');
assert.strictEqual(out.reference.revision,'12c8791b303e0a0b50f753af204249e622d0281a');

const missing=Export.exportMOT([{frame:1,assignments:[{trackId:1,cat:'team',score:.9}]}]);
assert.strictEqual(missing.status,'INDISPONIBLE');
assert.strictEqual(missing.reason,'TRACKING_BBOX_EVIDENCE_INCOMPLETE','TrackEval boxes must never be synthesized from point tracks');

const partial=Export.exportMOT([{frame:1,assignments:[{trackId:1,cat:'team',score:.9},{trackId:2,cat:'team',score:.8,bboxPx:box(0,0,20,40)}]}],{requireCompleteBoxEvidence:false});
assert.strictEqual(partial.status,'DISPONIBLE');
assert.strictEqual(partial.summary.exportedRows,1);
assert.strictEqual(partial.summary.bboxEvidenceCoverage,.5);

const over=Export.frameRows({frame:1,assignments:Array.from({length:12},(_,i)=>({trackId:i+1,cat:'team',bboxPx:box(i*10,10,8,20)}))});
assert.strictEqual(over.status,'INDISPONIBLE');
assert.strictEqual(over.reason,'CAY_ACTIVE_CAP_EXCEEDED');

assert.strictEqual(Export.exportMOT([]).status,'INDISPONIBLE');
console.log('tracking TrackEval export non-regression: PASS');
