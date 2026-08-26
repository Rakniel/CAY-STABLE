const assert=require('assert');
const runtimePresence=require('../observed_presence_runtime_bridge_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const fakeBridge={
  create(){
    const state={segment:1};
    return {
      state,
      processFrame(input,time,context){
        if(context&&context.segmentBreak)state.segment++;
        return (input||[]).map(x=>({...x}));
      },
      report(){
        return {players:Array.from({length:12},(_,i)=>({id:i+1,identityQuality:(i===7||i===11)?'PARTIEL':'FIABLE'})),team:{},teamCoverage:{}};
      }
    };
  }
};

const decorated=runtimePresence.decorate(fakeBridge);
ok(decorated.__observedPresenceRuntimeV1===true,'bridge marqué comme décoré');
ok(runtimePresence.decorate(decorated)===decorated,'décoration idempotente');
const bridge=decorated.create({maxPlayers:11});
const a=(ids,score=.9)=>ids.map((trackId,i)=>({trackId,score:score-i*.005,cat:trackId===1?'goalkeeper':'team'}));
bridge.processFrame(a([1,2,3,4,5,6,7,8,9,10,11]),0,{});
bridge.processFrame(a([1,2,3,4,5,6,7,8]),1,{});
bridge.processFrame(a([1,2,3,4,5,6,7,8,9,10,12]),2,{segmentBreak:true});
const projectors={2:{validated:true,segment:2,source:'manual_4_points',confidence:.96,project:p=>({x:p.x*100,y:p.y*60})}};
const report=bridge.report(projectors);
ok(report.presenceEvidence.rosterSize===12,'roster observé supérieur à 11 conservé');
ok(report.presenceEvidence.maxObservedSimultaneously===11,'maximum 11 simultanés');
ok(report.team.observedInstants===3,'trois instants réellement observés raccordés au rapport');
ok(report.team.observedPlayerSlots===30,'seuls les slots réellement visibles sont comptés');
ok(report.team.instantaneousPresenceCoverage===0.9091,'couverture par instant défendable');
ok(report.teamTimeline[1].presentCount===8,'joueurs hors champ non inventés');
ok(report.teamTimeline[2].presentIds.includes(12),'nouvel ID du roster conservé après changement de segment');
ok(report.teamTimeline[2].metricProjectionValidated===true,'calibration valide liée uniquement au segment 2');
ok(report.teamTimeline[0].metricProjectionValidated===false,'segment 1 non calibré reste non métrique');
ok(report.teamCoverage.metricProjection===0.3667,'couverture projection pondérée par présences observées');
ok(report.presenceEvidence.policy.substitutions==='NEVER_INFERRED_FROM_PRESENCE','aucun remplacement inféré depuis apparition/disparition');
ok(report.presenceEvidence.policy.noSilentCompletion===true,'aucune complétion silencieuse à onze');
ok(bridge.presenceState.frames.length===3,'registre runtime conservé sur le bridge');
ok(bridge.presenceSummary().players.some(p=>p.id===12),'résumé runtime expose le roster observé');
ok(report.teamTimeline.every(f=>new Set(f.presentIds).size===f.presentIds.length),'aucun doublon ID par frame');
console.log(`PASS ${pass}/16 observed presence runtime bridge`);
