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
const instant=stats.buildInstantTeamTimeline({active:[tracks[0],tracks[2]],archive:[tracks[1]]},{tracks:summaries},{2:{validated:true,source:'manual_4_points',confidence:.96,project:p=>({x:p.x*100,y:p.y*60})}});
ok(instant.observedInstants===3,'trois instants observés');
ok(instant.frames[0].presentCount===2,'instant 0: uniquement deux joueurs réellement observés');
ok(instant.frames[2].presentCount===2,'instant 2: deux joueurs présents après changement de plan');
ok(instant.frames.every(f=>new Set(f.presentIds).size===f.presentIds.length),'aucun ID dupliqué par instant');
ok(instant.frames[0].identityCoverage===0.5,'couverture identité instantanée calculée sur joueurs présents');
ok(instant.frames[2].identityCoverage===1,'identités fiables au plan 2');
ok(instant.frames[0].metricProjectionValidated===false,'plan 1 non métrique');
ok(instant.frames[2].metricProjectionValidated===true,'plan 2 métrique validé');
ok(instant.frames[2].metricCalibrationSource==='manual_4_points','provenance calibration conservée');
ok(instant.metricCoverage===0.3333,'couverture métrique pondérée par joueurs réellement observés');
ok(instant.calculation==='PAR_INSTANT_JOUEURS_OBSERVES_UNIQUEMENT','méthode explicite et défendable');
ok(instant.invalidObservedInstants===0,'aucune frame valide rejetée');
ok(instant.integrityPolicy==='AUCUNE_TRONCATURE_NI_DEDUPLICATION_SILENCIEUSE','politique intégrité explicite');

const overflowTracks=Array.from({length:12},(_,i)=>({globalId:i+1,archived:false,fullPath:[{x:.1+i*.01,y:.2,time:5,segment:3}]}));
const overflowSummaries=overflowTracks.map(t=>({id:t.globalId,quality:'FIABLE',dataQuality:{identity:'FIABLE'}}));
const overflow=stats.buildInstantTeamTimeline({active:overflowTracks,archive:[]},{tracks:overflowSummaries},{});
ok(overflow.totalSourceInstants===1,'frame overflow conservée comme preuve source');
ok(overflow.validObservedInstants===0,'frame >11 exclue des statistiques agrégées');
ok(overflow.invalidObservedInstants===1,'frame >11 signalée invalide');
ok(overflow.frames[0].invalidReason==='MORE_THAN_11_CAY_IDS','raison overflow explicite');
ok(overflow.frames[0].presentCount===0,'aucune troncature silencieuse à 11');
ok(overflow.frames[0].rejectedUniqueIds===12,'12 IDs rejetés conservés dans diagnostic');
ok(overflow.observedPlayerSlots===0,'aucun slot invalide utilisé dans les stats');

const duplicateTrack={globalId:21,archived:false,fullPath:[{x:.2,y:.2,time:7,segment:4},{x:.21,y:.21,time:7,segment:4}]};
const duplicate=stats.buildInstantTeamTimeline({active:[duplicateTrack],archive:[]},{tracks:[{id:21,quality:'FIABLE',dataQuality:{identity:'FIABLE'}}]},{});
ok(duplicate.invalidObservedInstants===1,'doublon même ID même frame rejeté');
ok(duplicate.frames[0].invalidReason==='DUPLICATE_ID_SAME_FRAME','raison doublon explicite');
ok(duplicate.frames[0].duplicateIds.length===1&&duplicate.frames[0].duplicateIds[0]===21,'ID dupliqué conservé pour diagnostic');
ok(duplicate.frames[0].presentIds.length===0,'doublon non dédupliqué silencieusement');
console.log(`PASS ${pass}/24 team instant stats`);
