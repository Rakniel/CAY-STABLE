const assert=require('assert');
const fs=require('fs');
const path=require('path');

require('../stable_runtime_tracking_v2.js');
const normalize=global.CAYStableRuntimeNormalizeAnchor;
assert.strictEqual(typeof normalize,'function','runtime anchor normalizer exported for non-regression coverage');

assert.strictEqual(normalize({x:-.01,y:.5}),null,'x < 0 must be rejected');
assert.strictEqual(normalize({x:1.01,y:.5}),null,'x > 1 must be rejected');
assert.strictEqual(normalize({x:.5,y:-.01}),null,'y < 0 must be rejected');
assert.strictEqual(normalize({x:.5,y:1.01}),null,'y > 1 must be rejected');
assert.strictEqual(normalize({x:NaN,y:.5}),null,'non-finite x must be rejected');
assert.deepStrictEqual(normalize({x:0,y:1}),{x:0,y:1},'exact image boundaries remain valid');
assert.deepStrictEqual(normalize({x:.42,y:.61}),{x:.42,y:.61},'valid normalized anchors remain unchanged');

const runtime=fs.readFileSync(path.join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');
assert(!runtime.includes('x:clamp01(p.x),y:clamp01(p.y)'), 'runtime must not clamp player anchors before bridge normalization');
assert(runtime.includes('normalizedTrackingAnchor(normTrackAnchor(b,c))'), 'runtime must apply strict anchor validation at the detection handoff');

console.log('PASS runtime out-of-frame anchor non-regression: 9/9');