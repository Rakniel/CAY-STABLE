(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsTestabilityGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const bool=v=>v===true;
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const CORE_KEYS=['tracking','trajectory','heatmap'];
  const PHYSICAL_KEYS=['distance','avgSpeed','maxSpeed','sprints'];

  function nextAction(status,blockers){
    if(status==='PHYSICAL_TESTABLE')return 'PREMIERS_RESULTATS_PRETS';
    if(status==='PITCH_VISUAL_TESTABLE'){
      const missing=PHYSICAL_KEYS.filter(key=>Number(blockers[key]||0)>0);
      return missing.length?'COMPLETER_METRIQUES_PHYSIQUES:'+missing.join(','):'VALIDER_METRIQUES_PHYSIQUES';
    }
    if(status==='TRACKING_TESTABLE'){
      const missing=['trajectory','heatmap'].filter(key=>Number(blockers[key]||0)>0);
      return missing.length?'DEBLOQUER_VISUELS_TERRAIN:'+missing.join(','):'VALIDER_VISUELS_TERRAIN';
    }
    return 'OBTENIR_TRACKING_DEFENDABLE';
  }

  function cardEvidence(card){
    const readiness=card?.firstResults||{};
    const tracking=bool(readiness.tracking);
    const trajectory=bool(readiness.trajectory);
    const heatmap=bool(readiness.heatmap);
    const distance=bool(readiness.distance);
    const avgSpeed=bool(readiness.avgSpeed);
    const maxSpeed=bool(readiness.maxSpeed);
    const sprints=bool(readiness.sprints);
    const physicalAny=distance||avgSpeed||maxSpeed||sprints||bool(readiness.physicalMetrics);
    const physicalComplete=distance&&avgSpeed&&maxSpeed&&sprints;
    const pitchVisualCore=tracking&&trajectory&&heatmap;
    const metricReady=pitchVisualCore&&physicalComplete;
    const flags={tracking,trajectory,heatmap,distance,avgSpeed,maxSpeed,sprints};
    const missingPitchVisualCore=CORE_KEYS.filter(key=>flags[key]!==true);
    const missingPhysicalMetrics=PHYSICAL_KEYS.filter(key=>flags[key]!==true);
    const status=metricReady?'PHYSICAL_TESTABLE':pitchVisualCore?'PITCH_VISUAL_TESTABLE':tracking?'TRACKING_TESTABLE':'INDISPONIBLE';
    const blockers={};
    for(const key of CORE_KEYS)blockers[key]=missingPitchVisualCore.includes(key)?1:0;
    for(const key of PHYSICAL_KEYS)blockers[key]=missingPhysicalMetrics.includes(key)?1:0;
    return {
      id:card?.id??null,
      status,
      tracking,
      trajectory,
      heatmap,
      pitchVisualCore,
      physicalAny,
      physicalComplete,
      metricReady,
      missingPitchVisualCore,
      missingPhysicalMetrics,
      nextAction:nextAction(status,blockers),
      policy:'CORE_VISUEL = TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; PRET_METRIQUES = CORE_VISUEL_ET_DISTANCE_ET_VITESSE_MOYENNE_ET_VITESSE_MAX_ET_SPRINTS'
    };
  }

  function blockerCounts(evidence){
    const keys=[...CORE_KEYS,...PHYSICAL_KEYS];
    const counts={};
    for(const key of keys)counts[key]=evidence.filter(item=>{
      if(key==='tracking'||key==='trajectory'||key==='heatmap')return item.missingPitchVisualCore.includes(key);
      return item.missingPhysicalMetrics.includes(key);
    }).length;
    return counts;
  }

  function evaluate(playerCards,options={}){
    const cards=Array.isArray(playerCards?.players)?playerCards.players:[];
    const evidence=cards.map(cardEvidence);
    const count=key=>evidence.filter(item=>item[key]===true).length;
    const players=evidence.length;
    const minCorePlayers=finite(options.minCorePlayers)?Math.max(1,Math.floor(Number(options.minCorePlayers))):1;
    const minMetricPlayers=finite(options.minMetricPlayers)?Math.max(1,Math.floor(Number(options.minMetricPlayers))):1;
    const withTracking=count('tracking');
    const withCorePitchVisuals=count('pitchVisualCore');
    const withAnyPhysicalMetrics=count('physicalAny');
    const withCompletePhysicalMetrics=count('physicalComplete');
    const metricReadyPlayers=count('metricReady');
    const coreTestable=withCorePitchVisuals>=minCorePlayers;
    const physicalTestable=metricReadyPlayers>=minMetricPlayers;
    const status=physicalTestable?'PHYSICAL_TESTABLE':coreTestable?'PITCH_VISUAL_TESTABLE':withTracking>0?'TRACKING_TESTABLE':'INDISPONIBLE';
    const blockers=blockerCounts(evidence);
    return {
      version:'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_3',
      status,
      players,
      withTracking,
      withCorePitchVisuals,
      withAnyPhysicalMetrics,
      withCompletePhysicalMetrics,
      metricReadyPlayers,
      thresholds:{minCorePlayers,minMetricPlayers},
      coreTestable,
      physicalTestable,
      blockers,
      nextAction:nextAction(status,blockers),
      evidence,
      policy:'FAIL_CLOSED; AUCUN_JOUEUR_PRET_TERRAIN_SANS_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; AUCUN_JOUEUR_PRET_METRIQUES_SANS_4_METRIQUES_PHYSIQUES_DEFENDABLES'
    };
  }

  function installRuntime(){
    const Bridge=typeof globalThis!=='undefined'?globalThis.CAYStableTrackingBridge:null;
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayFirstResultsTestabilityPatched)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){
      const instance=baseCreate(options);
      if(!instance||typeof instance.report!=='function')return instance;
      const baseReport=instance.report.bind(instance);
      instance.report=function(projectors,visualOptions){
        const report=baseReport(projectors,visualOptions);
        if(!report||!report.playerCards||!Array.isArray(report.playerCards.players))return report;
        const testability=evaluate(report.playerCards);
        report.playerCards={...report.playerCards,testability};
        report.firstResultsTestability=testability;
        return report;
      };
      return instance;
    };
    Bridge.__cayFirstResultsTestabilityPatched=true;
    return true;
  }

  installRuntime();
  return {cardEvidence,blockerCounts,nextAction,evaluate,installRuntime};
});
