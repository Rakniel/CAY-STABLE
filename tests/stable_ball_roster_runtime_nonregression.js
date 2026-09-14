const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');
const bundle=fs.readFileSync('tools/integrate_stable_bundle.py','utf8');
const integrator=fs.readFileSync('tools/integrate_ball_runtime.py','utf8');

assert(bundle.includes("run('integrate_ball_runtime.py')"),'canonical STABLE bundle must integrate roster-guarded ball runtime');

const marker='<!-- STABLE_BALL_ROSTER_OWNERSHIP_V1 -->';
const tags=[
  '<script src="./ball_event_state_v1.js"></script>',
  '<script src="./track_roster_binding_v1.js"></script>',
  '<script src="./ball_roster_ownership_bridge_v1.js"></script>',
];

assert(integrator.includes(marker),'ball runtime integrator must retain canonical marker');
assert.equal(html.split(marker).length-1,1,'ball runtime marker must appear exactly once in shipped HTML');
for(const tag of tags)assert.equal(html.split(tag).length-1,1,`shipped HTML must contain exactly one ${tag}`);
const canonicalBlock=marker+'\n'+tags.join('\n')+'\n';
assert(html.includes(canonicalBlock),'ball runtime scripts must be emitted as one canonical dependency-ordered block');

console.log('STABLE roster-guarded ball runtime non-regression: PASS');
