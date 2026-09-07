'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const html=fs.readFileSync('CAY_CALIBRATION_TEST.html','utf8');
for(const ref of [
  './metric_homography_projector_v1.js',
  './pitch_geometry_guard_v1.js',
  './automatic_pitch_calibration_v1.js',
  './pitch_semantic_calibration_v2.js'
]) assert(html.includes(ref),`missing canonical calibration dependency ${ref}`);
assert(html.includes('CAYPitchSemanticCalibrationV2'),'semantic calibration runtime must be authoritative');
assert(html.includes('Semantic.evaluate('),'test harness must delegate verdict to semantic calibration engine');
assert(html.includes('AFFICHER CETTE IMAGE'),'real video frame display control missing');
assert(html.includes('imageCanvas'),'real video frame canvas missing');
assert(html.includes('32 repères football'),'semantic landmark UX missing');
assert(html.includes('observations.size<6'),'six-landmark evidence floor missing');
assert(!html.includes('function solveHomography'),'test harness must not duplicate homography solver');
assert(!html.includes('function gaussian('),'test harness must not duplicate linear algebra solver');
assert(!html.includes('canvasToPitch('),'arbitrary free pitch coordinate clicking must not return');
const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
assert(blocks.length===1,'expected one inline runtime script');
new vm.Script(blocks[0],{filename:'CAY_CALIBRATION_TEST.inline.js'});
console.log('calibration test harness non-regression: PASS');
