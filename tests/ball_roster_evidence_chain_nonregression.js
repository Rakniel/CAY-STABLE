const assert=require('assert');
const Bridge=require('../ball_roster_ownership_bridge_v1.js');
const Binding=require('../track_roster_binding_v1.js');

let bindingState=Binding.createState();
bindingState=Binding.bind(bindingState,{trackId:'track-9',playerId:'cay-9',source:'MANUAL',confidence:.99,confirmed:true});

function player(x=10){return {id:'track-9',team:'CAY',pitchX:x,pitchY:10,confidence:.95,onField:true};}
function sample(time,ballX,extra={}){
  return {time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players:[player()],...extra};
}

// The authoritative roster path must reuse the live-play evidence bridge rather
// than bypassing it. Explicit replay metadata therefore removes those frames
// from event/possession evidence and breaks continuity.
{
  const samples=[
    sample(0,10.1),sample(.2,10.1),sample(.4,10.1),
    sample(.6,18,{isReplay:true}),sample(.8,20,{isReplay:true}),
    sample(1.0,10.1),sample(1.2,10.1),sample(1.4,10.1)
  ];
  const r=Bridge.analyzeBallEvents(samples,{clubTeam:'CAY',bindingState,ballOptions:{minStableOwnershipSec:.2,minCoverage:.3}});
  assert.equal(r.evidenceChain,'BALL_ROSTER_OWNERSHIP_BRIDGE_V1->BALL_EVENT_EVIDENCE_BRIDGE_V1');
  assert.equal(r.nonLiveExcludedFrames,2,'explicit replay frames must be excluded on roster-guarded path');
  assert.equal(r.nonLiveRuns,1);
  assert(r.rosterGuard.mappedClubPlayers>=6,'live CAY observations should remain roster mapped');
}

// Ball observability alone is not enough to publish possession. A long FREE
// ball sequence has reliable ball-event coverage but zero stable-owner coverage,
// so possession must fail closed while diagnostic evidence remains available.
{
  const samples=[
    sample(0,50),sample(.2,50),sample(.4,50),sample(.6,50),sample(.8,50),sample(1.0,50)
  ];
  const r=Bridge.analyzeBallEvents(samples,{clubTeam:'CAY',bindingState,ballOptions:{minCoverage:.5}});
  assert.equal(r.quality,'FIABLE','FREE ball observations should still provide reliable ball-event coverage');
  assert.equal(r.possessionCoverage,0);
  assert.equal(r.possession,'INDISPONIBLE');
  assert.equal(r.playerPossession,'INDISPONIBLE');
  assert.equal(r.fieldStatus.possession,'INDISPONIBLE');
  assert(r.diagnosticPossession&&typeof r.diagnosticPossession==='object','raw possession diagnostics must remain auditable');
}

// The canonical roster path is authoritative, so pass publication must require
// kick-release evidence by default. Only an explicit diagnostic opt-out may
// disable it; nested ballOptions remains authoritative when supplied.
{
  const defaults=Bridge.evidenceOptions({ballOptions:{minCoverage:.7}});
  assert.equal(defaults.minCoverage,.7);
  assert.equal(defaults.requireKickEvidence,true,'roster pass publication must fail closed on kick evidence by default');

  const explicitOff=Bridge.evidenceOptions({ballOptions:{minCoverage:.7},requireKickEvidence:false});
  assert.equal(explicitOff.requireKickEvidence,false,'top-level diagnostic opt-out must remain explicit and supported');

  const nestedOff=Bridge.evidenceOptions({ballOptions:{minCoverage:.7,requireKickEvidence:false},requireKickEvidence:true});
  assert.equal(nestedOff.requireKickEvidence,false,'nested ballOptions must remain authoritative when explicitly configured');

  const merged=Bridge.evidenceOptions({ballOptions:{minCoverage:.7},requireKickEvidence:true,kickEvidence:{minKickScore:.8}});
  assert.equal(merged.minCoverage,.7);
  assert.equal(merged.requireKickEvidence,true);
  assert.deepEqual(merged.kickEvidence,{minKickScore:.8});
}

console.log('ball roster evidence chain non-regression: PASS');
