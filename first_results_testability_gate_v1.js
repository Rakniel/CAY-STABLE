(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsTestabilityGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const bool=v=>v===true;
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));

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
    return {
      id:card?.id??null,
      tracking,
      trajectory,
      heatmap,
      pitchVisualCore,
      physicalAny,
      physicalComplete,
      metricReady,
      policy:'CORE_VISUEL = TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; PRET_METRIQUES = CORE_VISUEL_ET_DISTANCE_ET_VITESSE_MOYENNE_ET_VITESSE_MAX_ET_SPRINTS'
    };
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
    return {
      version:'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1',
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
      evidence,
      policy:'FAIL_CLOSED; AUCUN_JOUEUR_PRET_TERRAIN_SANS_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; AUCUN_JOUEUR_PRET_METRIQUES_SANS_4_METRIQUES_PHYSIQUES_DEFENDABLES'
    };
  }

  return {cardEvidence,evaluate};
});
