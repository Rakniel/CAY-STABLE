const fs=require('fs');
const assert=require('assert');
const childProcess=require('child_process');

// Earlier integration tests intentionally exercise narrower integrators and may
// leave the working HTML in a non-canonical intermediate state. Rebuild the
// exact shipped bundle before asserting the ball runtime contract.
childProcess.execFileSync('python3',['tools/integrate_stable_bundle.py'],{stdio:'pipe'});

const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');
const bundle=fs.readFileSync('tools/integrate_stable_bundle.py','utf8');
const integrator=fs.readFileSync('tools/integrate_ball_runtime.py','utf8');
const shotEvidence=require('../shot_temporal_evidence_v1.js');

assert(bundle.includes("run('integrate_ball_runtime.py')"),'canonical STABLE bundle must integrate roster-guarded ball runtime');

const marker='<!-- STABLE_BALL_ROSTER_OWNERSHIP_V1 -->';
const tags=[
  '<script src="./ball_event_state_v1.js"></script>',
  '<script src="./ball_kick_evidence_v1.js"></script>',
  '<script src="./shot_temporal_evidence_v1.js"></script>',
  '<script src="./ball_event_evidence_bridge_v1.js"></script>',
  '<script src="./track_roster_binding_v1.js"></script>',
  '<script src="./ball_roster_ownership_bridge_v1.js"></script>',
];

assert(integrator.includes(marker),'ball runtime integrator must retain canonical marker');
assert.equal(html.split(marker).length-1,1,'ball runtime marker must appear exactly once in shipped HTML');
for(const tag of tags)assert.equal(html.split(tag).length-1,1,`shipped HTML must contain exactly one ${tag}`);
const canonicalBlock=marker+'\n'+tags.join('\n')+'\n';
assert(html.includes(canonicalBlock),'ball runtime scripts must be emitted as one canonical dependency-ordered block');

// Shipping the diagnostic engine must never silently promote a candidate shot
// to a publishable statistic. The current contract is deliberately review-only.
const diagnostic=shotEvidence.analyze([
  {time:0.00,segment:'live-1',ball:{pitchX:0,pitchY:0,confidence:.95},kickEvidenceScore:.95},
  {time:0.10,segment:'live-1',ball:{pitchX:.2,pitchY:0,confidence:.95},kickEvidenceScore:.95},
  {time:0.20,segment:'live-1',ball:{pitchX:2.2,pitchY:0,confidence:.95},kickEvidenceScore:.95},
  {time:0.30,segment:'live-1',ball:{pitchX:4.4,pitchY:0,confidence:.95},kickEvidenceScore:.95},
],{minEvidenceFrames:2,minBallSpeedMps:10,minBallAccelerationMps2:5});
assert(diagnostic.candidateCount>=1,'temporal shot diagnostic should be executable from the shipped runtime contract');
assert(diagnostic.candidates.every(candidate=>candidate.publishable===false&&candidate.quality==='A_VERIFIER'),'shot candidates must remain non-publishable review evidence');
assert.equal(diagnostic.publicationPolicy,'NEVER_AUTO_PUBLISH','shot diagnostic must retain its fail-closed publication policy');

console.log('STABLE roster-guarded ball + temporal shot diagnostic runtime non-regression: PASS');
