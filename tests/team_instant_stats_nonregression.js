const assert=require('assert');
const stats=require('../player_stats_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};
const tracks=[
  {globalId:1,archived:false,fullPath:[{x:.1,y:.2,time:0,segment:1},{x:.2,y:.2,time:1,segment:1},{x:.3,y:.2,time:2,segment:2}]},
  {globalId:2,archived:true,fullPath:[{x:.5,y:.5,time:0,segment:1},{x:.55,y:.5,time:1,segment:1}]},
  {globalId:3,archived:false,fullPath:[{x:.7,y:.4,time:2,segment:2}]}
];
const summaries=[
  {id:1,quality:'FIABLE',dataQuality:{identity:'FIABLE'}},
  {id:2,quality:'PARTIEL',dataQuality:{identity:'PARTIEL'}},
  {id:3,quality:'FIABLE',dataQuality:{identity:'FIABLE'}}
];
const instant=stats.buildInstantTeamTimeline({active:[tracks[0],tracks[2]],archive:[tracks[1]]},{tracks:summaries},{2:p=>({x:p.x*100,y:p.y*60})});
ok(instant.observedInstants===3,'trois instants observés');
ok(instant.frames[0].presentCount===2,'instant 0: uniquement deux joueurs réellement observés');
ok(instant.frames[2].presentCount===2,'instant 2: deux joueurs présents après changement de plan');
ok(instant.frames.every(f=>new Set(f.presentIds).size===f.presentIds.length),'aucun ID dupliqué par instant');
ok(instant.frames[0].identityCoverage===0.5,'couverture identité instantanée calculée sur joueurs présents');
ok(instant.frames[2].identityCoverage===1,'identités fiables au plan 2');
ok(instant.frames[0].metricProjectionValidated===false,'plan 1 non métrique');
ok(instant.frames[2].metricProjectionValidated===true,'plan 2 métrique validé');
ok(instant.metricCoverage===0.3333,'couverture métrique pondérée par joueurs réellement observés');
ok(instant.calculation==='PAR_INSTANT_JOUEURS_OBSERVES_UNIQUEMENT','méthode explicite et défendable');
console.log(`PASS ${pass}/10 team instant stats`);
