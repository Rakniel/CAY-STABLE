const assert=require('assert');
const Presence=require('../observed_presence_v1.js');
let pass=0,fail=0;
function check(name,fn){try{fn();console.log('PASS',name);pass++;}catch(e){console.error('FAIL',name,e.message);fail++;}}
const s=Presence.createState();
const base=[];
for(let i=1;i<=11;i++)base.push({trackId:i,score:.95-i*.005,cat:i===1?'goalkeeper':'team'});
let f=Presence.observeFrame(s,base,0,{segment:1});
check('eleven observed players are accepted',()=>assert.equal(f.observedCount,11));
check('full observed frame is reliable',()=>assert.equal(f.quality,'FIABLE'));
check('coverage is exactly one at eleven',()=>assert.equal(f.coverage,1));
check('IDs are unique on a frame',()=>assert.equal(new Set(f.observedIds).size,11));

// Overflow uses a different newcomer so player 12 can be introduced later and
// its first-observation timestamp remains an independent regression check.
f=Presence.observeFrame(s,[...base,{trackId:13,score:.99},{trackId:5,score:.999}],1,{segment:1});
check('overflow instant is rejected rather than silently capped to eleven',()=>assert.equal(f.observedCount,0));
check('overflow instant is explicitly unavailable',()=>assert.equal(f.quality,'INDISPONIBLE'));
check('overflow source evidence is rejected',()=>assert.equal(f.evidenceValid,false));
check('overflow count is recorded on the frame',()=>assert.equal(f.rejectedOverflowCount,1));
check('duplicate ID is rejected before team presence',()=>assert.equal(new Set(f.observedIds).size,f.observedIds.length));
check('duplicate rejection is diagnosed',()=>assert.equal(s.rejectedDuplicateIds,1));
check('overflow rejection is diagnosed',()=>assert.equal(s.rejectedOverflow,1));
check('overflow candidates cannot pollute the confirmed roster',()=>assert.equal(Presence.summarize(s).players.some(p=>p.id===13),false));

f=Presence.observeFrame(s,base.slice(0,8),2,{segment:1});
check('missing players are not silently counted present',()=>assert.equal(f.observedCount,8));
check('partial observation is explicit',()=>assert.equal(f.quality,'PARTIEL'));
check('partial coverage is explicit',()=>assert.equal(f.coverage,8/11));

Presence.observeFrame(s,[...base.slice(0,10),{trackId:12,score:.97,cat:'team'}],3,{segment:1});
const summary=Presence.summarize(s);
check('roster may exceed eleven across match',()=>assert.ok(summary.rosterSize>=12));
check('maximum simultaneous presence remains eleven',()=>assert.equal(summary.maxObservedSimultaneously,11));
check('later player has its own first observation',()=>assert.equal(summary.players.find(p=>p.id===12).firstObserved,3));
check('presence never infers substitutions',()=>assert.equal(summary.policy.substitutions,'NEVER_INFERRED_FROM_PRESENCE'));
check('instant policy excludes unobserved players',()=>assert.equal(summary.policy.missingPlayer,'NOT_COUNTED_PRESENT_AT_INSTANT'));

Presence.observeFrame(s,[],4,{segment:2});
f=Presence.frameAtOrBefore(s,4);
check('empty frame remains unavailable rather than estimated',()=>assert.equal(f.quality,'INDISPONIBLE'));
check('empty frame has zero observed players',()=>assert.equal(f.observedCount,0));
check('segment provenance is retained',()=>assert.equal(f.segment,2));

const invalidInputs=Presence.createState();
const sanitized=Presence.observeFrame(invalidInputs,[
  {trackId:true,score:.99},
  {trackId:[4],score:.99},
  {trackId:'1',score:2},
  {trackId:2,score:-.25},
  {trackId:3,score:.8}
],5,{segment:1});
check('boolean and array track IDs cannot fabricate players',()=>assert.deepStrictEqual([...sanitized.observedIds].sort((a,b)=>a-b),[1,2,3]));
check('out-of-range scores cannot fabricate observation confidence',()=>assert.strictEqual(sanitized.confidence,.8));
const sanitizedPlayers=Presence.summarize(invalidInputs).players;
check('confidence above one remains unknown',()=>assert.strictEqual(sanitizedPlayers.find(p=>p.id===1).identityObservationConfidence,null));
check('negative confidence remains unknown',()=>assert.strictEqual(sanitizedPlayers.find(p=>p.id===2).identityObservationConfidence,null));
const duplicateInput=Presence.createState();
const chosen=Presence.observeFrame(duplicateInput,[{trackId:1,score:2},{trackId:1,score:.7}],0);
check('valid duplicate confidence outranks invalid score',()=>assert.strictEqual(chosen.confidence,.7));
console.log(`observed presence: ${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
