'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const Bench=require('../detector_benchmark_v1.js');
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','real_video_detector_benchmark_v1.json'),'utf8'));
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

ok(Bench.validateSpec(spec)===true,'real-video benchmark spec is valid');

const good=spec.frames.map(f=>({id:f.id,onPitchCount:f.minOnPitch??f.maxOnPitch??0,offPitchCount:0}));
const g=Bench.evaluate(spec,good);
ok(g.summary.promotionEligible===true,'conservative lower-bound run is promotable');
ok(g.summary.activeCoverage===1,'conservative lower-bound run has full benchmark coverage');
ok(g.summary.emptyFalsePositives===0,'empty pitch remains empty');
ok(g.summary.offPitchPolicyFrames===1,'bench-visible frame explicitly audits off-pitch leakage');
ok(g.summary.offPitchViolations===0,'clean run has no bench/staff leakage');

const hogLike={
 t0120:12,t0600:9,t1200:19,t1800:7,t2400:10,t3000:1,t3600:6,t4200:8,t4800:10,t5400:13,t6200:14
};
const h=Bench.evaluate(spec,Object.entries(hogLike).map(([id,count])=>({id,onPitchCount:count,offPitchCount:0})));
ok(h.summary.promotionEligible===false,'HOG-like count baseline cannot be promoted');
ok(h.summary.criticalFailures>=3,'HOG-like baseline fails critical real-video cases');
ok(h.summary.emptyFalsePositives===1,'empty-pitch false positive is preserved in the verdict');

const benchLeak=good.map(o=>o.id==='t5400'?{...o,offPitchCount:3}:o);
const b=Bench.evaluate(spec,benchLeak);
ok(b.summary.promotionEligible===false,'bench/staff detections block detector promotion even when on-pitch coverage is sufficient');
ok(b.summary.offPitchViolations===1,'bench/staff policy violation is counted');
ok(b.summary.offPitchExcessDetections===3,'off-pitch excess remains measurable');
ok(b.frames.find(f=>f.id==='t5400')?.reason==='above_off_pitch_maximum','bench-visible frame exposes the rejection reason');

const missingOffPitch=good.map(o=>o.id==='t5400'?{id:o.id,onPitchCount:o.onPitchCount}:o);
const mo=Bench.evaluate(spec,missingOffPitch);
ok(mo.summary.promotionEligible===false,'missing off-pitch observation fails closed when the fixture requires it');
ok(mo.summary.missingOffPitchObservations===1,'missing off-pitch evidence is explicit');

const missing=Bench.evaluate(spec,good.slice(0,-1));
ok(missing.summary.promotionEligible===false,'missing benchmark frame blocks promotion');
ok(missing.summary.missingObservations===1,'missing observation is counted');

const weak=good.map(o=>({...o,onPitchCount:o.id==='t3000'?0:Math.floor(o.onPitchCount*.5)}));
const w=Bench.evaluate(spec,weak);
ok(w.summary.activeCoverage<.82,'weak detector falls below real-video coverage threshold');
ok(w.summary.promotionEligible===false,'weak detector cannot be promoted');

console.log(`${checks}/${checks} real-video detector benchmark non-regression: PASS`);
