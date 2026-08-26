const assert=require('assert');
const R=require('../replacement_events_v1.js');
let pass=0; const check=(name,v)=>{assert(v,name);pass++;};
const ids=[1,2,3,4,5,6,7,8,9,10,11,12,13];
const layer=R.buildValidatedReplacementLayer([
  {type:'replacement',validated:true,outPlayerId:2,inPlayerId:12,time:60,segment:4,source:'manual',confidence:.99},
  {type:'replacement',validated:true,outPlayerId:3,inPlayerId:13,time:70,segment:4,source:'manual',confidence:.98},
  {type:'replacement',validated:true,outPlayerId:2,inPlayerId:11,time:75,segment:4,source:'manual',confidence:.97},
  {type:'replacement',validated:true,outPlayerId:4,inPlayerId:12,time:80,segment:5,source:'manual',confidence:.99}
],ids);
const initial=[1,2,3,4,5,6,7,8,9,10,11];
const timeline=R.auditRosterTimeline(layer,initial);
check('initial 11 accepted',timeline.initialActiveIds.length===11);
check('max active remains 11',timeline.maxActive===11&&timeline.snapshots.every(s=>s.count===11));
check('first valid replacement accepted',timeline.acceptedEvents.some(e=>e.outPlayerId===2&&e.inPlayerId===12));
check('second valid replacement accepted',timeline.acceptedEvents.some(e=>e.outPlayerId===3&&e.inPlayerId===13));
check('out player already off rejected',timeline.rejectedEvents.some(e=>e.reason==='OUT_PLAYER_NOT_ACTIVE'&&e.event.outPlayerId===2));
check('incoming already active rejected',timeline.rejectedEvents.some(e=>e.reason==='IN_PLAYER_ALREADY_ACTIVE'&&e.event.inPlayerId===12));
check('inconsistent validated events make partial quality',timeline.quality==='PARTIEL');
check('coverage counts four validated events',timeline.coverage.validatedEvents===4);
check('coverage counts two consistent events',timeline.coverage.consistentEvents===2);
check('coverage counts two rejected events',timeline.coverage.rejectedEvents===2);
check('final roster contains substitutes',timeline.finalActiveIds.includes(12)&&timeline.finalActiveIds.includes(13));
check('final roster removed outgoing players',!timeline.finalActiveIds.includes(2)&&!timeline.finalActiveIds.includes(3));
check('final roster still eleven',timeline.finalActiveIds.length===11);
check('segment provenance kept',timeline.snapshots[1].segment===4);
check('manual source kept',timeline.snapshots[0].source==='manual');
const unavailable=R.auditRosterTimeline(layer,null);
check('no initial lineup means unavailable',unavailable.quality==='INDISPONIBLE');
check('no initial lineup is never inferred',unavailable.reason==='INITIAL_LINEUP_NOT_VALIDATED'&&unavailable.finalActiveIds.length===0);
const badInitial=R.auditRosterTimeline(layer,[1,1,2]);
check('duplicate initial ids rejected',badInitial.reason==='INVALID_INITIAL_LINEUP');
const tooMany=R.auditRosterTimeline(layer,[1,2,3,4,5,6,7,8,9,10,11,12]);
check('more than eleven initial players rejected',tooMany.reason==='INVALID_INITIAL_LINEUP');
console.log(`PASS replacement roster timeline: ${pass}/19`);
