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

f=Presence.observeFrame(s,[...base,{trackId:12,score:.99},{trackId:5,score:.999}],1,{segment:1});
check('simultaneous CAY count never exceeds eleven',()=>assert.equal(f.observedCount,11));
check('duplicate ID is rejected before team presence',()=>assert.equal(new Set(f.observedIds).size,f.observedIds.length));
check('duplicate rejection is diagnosed',()=>assert.equal(s.rejectedDuplicateIds,1));
check('overflow rejection is diagnosed',()=>assert.equal(s.rejectedOverflow,1));

f=Presence.observeFrame(s,base.slice(0,8),2,{segment:1});
check('missing players are not silently counted present',()=>assert.equal(f.observedCount,8));
check('partial observation is explicit',()=>assert.equal(f.quality,'PARTIEL'));
check('partial coverage is explicit',()=>assert.equal(f.coverage,8/11));

Presence.observeFrame(s,[...base.slice(0,10),{trackId:12,score:.97,cat:'team'}],3,{segment:1});
const summary=Presence.summarize(s);
check('roster may exceed eleven across match',()=>assert.equal(summary.rosterSize,12));
check('maximum simultaneous presence remains eleven',()=>assert.equal(summary.maxObservedSimultaneously,11));
check('later player has its own first observation',()=>assert.equal(summary.players.find(p=>p.id===12).firstObserved,3));
check('presence never infers substitutions',()=>assert.equal(summary.policy.substitutions,'NEVER_INFERRED_FROM_PRESENCE'));
check('instant policy excludes unobserved players',()=>assert.equal(summary.policy.missingPlayer,'NOT_COUNTED_PRESENT_AT_INSTANT'));

Presence.observeFrame(s,[],4,{segment:2});
f=Presence.frameAtOrBefore(s,4);
check('empty frame remains unavailable rather than estimated',()=>assert.equal(f.quality,'INDISPONIBLE'));
check('empty frame has zero observed players',()=>assert.equal(f.observedCount,0));
check('segment provenance is retained',()=>assert.equal(f.segment,2));
console.log(`observed presence: ${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
