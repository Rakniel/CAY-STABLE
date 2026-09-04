'use strict';

const fs=require('fs');
const assert=require('assert');

const integrator=fs.readFileSync('tools/integrate_tracking_v2.py','utf8');
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

const tags=[
  '<script src="./player_stats_v1.js"></script>',
  '<script src="./app_domain_models_v1.js"></script>',
  '<script src="./track_roster_binding_v1.js"></script>',
  '<script src="./roster_metric_pipeline_v1.js"></script>',
  '<script src="./player_card_roster_binding_v1.js"></script>'
];

for(const tag of tags){
  assert(integrator.includes(tag),`canonical manifest missing ${tag}`);
}

const positions=tags.map(tag=>integrator.indexOf(tag));
assert.deepStrictEqual(positions,[...positions].sort((a,b)=>a-b),'roster metric runtime dependencies must load in safe order');

// The checked-in HTML may lag the manifest on a PR because the integrator is what
// produces the validated artifact. If a tag is present already, it must be unique.
for(const tag of tags){
  const count=html.split(tag).length-1;
  assert(count===0||count===1,`checked-in HTML duplicates ${tag}`);
}

console.log('roster metric runtime manifest non-regression: PASS');
