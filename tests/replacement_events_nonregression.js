const assert=require('assert');
const R=require('../replacement_events_v1.js');
let pass=0; const check=(name,v)=>{assert(v,name);pass++;};
const ids=[1,2,3,12];
let layer=R.buildValidatedReplacementLayer([
 {type:'replacement',validated:true,outPlayerId:2,inPlayerId:12,time:61.2,segment:4,source:'manual',confidence:.98},
 {type:'replacement',validated:false,outPlayerId:1,inPlayerId:3,time:40},
 {type:'replacement',validated:true,outPlayerId:3,inPlayerId:99,time:70},
 {type:'replacement',validated:true,outPlayerId:1,inPlayerId:3,time:80,confidence:.5}
],ids);
check('only one validated replacement accepted',layer.confirmedCount===1);
check('unvalidated event rejected',layer.rejected.some(x=>x.reason==='EVENT_NOT_VALIDATED'));
check('unknown player rejected',layer.rejected.some(x=>x.reason==='UNKNOWN_PLAYER_ID'));
check('low-confidence validation rejected',layer.rejected.some(x=>x.reason==='VALIDATION_CONFIDENCE_TOO_LOW'));
check('accepted layer is reliable',layer.quality==='FIABLE');
check('outgoing player provenance created',layer.byPlayer[2][0].direction==='OUT');
check('incoming player provenance created',layer.byPlayer[12][0].direction==='IN');
check('counterpart retained',layer.byPlayer[12][0].counterpartId===2);
check('segment retained',layer.events[0].segment===4);
check('source retained',layer.events[0].source==='manual');
const card=R.applyToPlayerCard({id:12,rosterState:{replacementConfirmed:false}},layer);
check('player card becomes confirmed only from validated event',card.rosterState.replacementConfirmed===true);
check('player card stores replacement event',card.replacementEvents.length===1);
const empty=R.buildValidatedReplacementLayer([],ids);
check('no events remains unavailable',empty.quality==='INDISPONIBLE');
const untouched=R.applyToPlayerCard({id:3,rosterState:{}},empty);
check('no silent replacement inference',untouched.rosterState.replacementConfirmed===false);
const dup=R.buildValidatedReplacementLayer([
 {type:'replacement',validated:true,outPlayerId:2,inPlayerId:12,time:61.2,segment:4},
 {type:'replacement',validated:true,outPlayerId:2,inPlayerId:12,time:61.2,segment:4}
],ids);
check('duplicates counted once',dup.confirmedCount===1);
check('duplicate rejection measurable',dup.rejected.some(x=>x.reason==='DUPLICATE_EVENT'));
console.log(`PASS validated replacement events: ${pass}/16`);
