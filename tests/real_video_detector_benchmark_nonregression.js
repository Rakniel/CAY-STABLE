'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const Bench=require('../detector_benchmark_v1.js');
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','real_video_detector_benchmark_v1.json'),'utf8'));
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

ok(Bench.validateSpec(spec)===true,'real-video benchmark spec is valid');

const good=spec.frames.map(f=>({id:f.id,onPitchCount:f.minOnPitch??f.maxOnPitch??0}));
const g=Bench.evaluate(spec,good);
ok(g.summary.promotionEligible===true,'conservative lower-bound run is promotable');
ok(g.summary.activeCoverage===1,'conservative lower-bound run has full benchmark coverage');
ok(g.summary.emptyFalsePositives===0,'empty pitch remains empty');

const hogLike={
 t0120:12,t0600:9,t1200:19,t1800:7,t2400:10,t3000:1,t3600:6,t4200:8,t4800:10,t5400:13,t6200:14
};
const h=Bench.evaluate(spec,Object.entries(hogLike).map(([id,count])=>({id,onPitchCount:count})));
ok(h.summary.promotionEligible===false,'HOG-like count baseline cannot be promoted');
ok(h.summary.criticalFailures>=3,'HOG-like baseline fails critical real-video cases');
ok(h.summary.emptyFalsePositives===1,'empty-pitch false positive is preserved in the verdict');

const missing=Bench.evaluate(spec,good.slice(0,-1));
ok(missing.summary.promotionEligible===false,'missing benchmark frame blocks promotion');
ok(missing.summary.missingObservations===1,'missing observation is counted');

const weak=good.map(o=>({...o,onPitchCount:o.id==='t3000'?0:Math.floor(o.onPitchCount*.5)}));
const w=Bench.evaluate(spec,weak);
ok(w.summary.activeCoverage<.82,'weak detector falls below real-video coverage threshold');
ok(w.summary.promotionEligible===false,'weak detector cannot be promoted');

console.log(`${checks}/${checks} real-video detector benchmark non-regression: PASS`);
