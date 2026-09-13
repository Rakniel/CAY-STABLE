(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsRuntimeGuardBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='CAY_FIRST_RESULTS_RUNTIME_GUARD_BRIDGE_V1';
  const BLOCKED_ACTION='RETABLIR_RUNTIME_TRACKING_STABLE';

  function runtimeState(env=root){
    const guard=env?.CAYStableTrackingRuntimeGuard;
    if(guard&&typeof guard.verdict==='function'){
      const state=guard.verdict(env);
      if(state&&typeof state==='object')return state;
    }
    const state=env?.CAYStableTrackingRuntimeGuardState;
    if(state&&typeof state==='object')return state;
    return {
      version:'CAY_STABLE_TRACKING_RUNTIME_GUARD_MISSING',
      ok:false,
      twoStage:false,
      cameraConsensus:false,
      backend:'INDISPONIBLE',
      cameraMotion:'INDISPONIBLE',
      reasons:['TRACKING_RUNTIME_GUARD_MISSING'],
      policy:'FAIL_CLOSED; AUCUN_PREMIER_RESULTAT_CAY_N_EST_PUBLIE_SI_LE_GARDE_RUNTIME_TRACKING_N_EST_PAS_CHARGE'
    };
  }

  function blockedReadiness(readiness,reasons){
    const source=readiness&&typeof readiness==='object'?readiness:{};
    return {
      ...source,
      diagnosticReadiness:{...source},
      diagnosticStatus:source.status||null,
      status:'INDISPONIBLE',
      tracking:false,
      trajectory:false,
      heatmap:false,
      distance:false,
      avgSpeed:false,
      maxSpeed:false,
      sprints:false,
      distanceAvailable:false,
      avgSpeedAvailable:false,
      maxSpeedAvailable:false,
      sprintsAvailable:false,
      physicalMetrics:false,
      physicalMetricsAvailable:false,
      physicalMetricsComplete:false,
      pitchVisualCore:false,
      pitchResults:false,
      metricReady:false,
      runtimeTrackingReady:false,
      runtimeBlockers:[...reasons],
      nextAction:BLOCKED_ACTION,
      policy:'PUBLICATION_FAIL_CLOSED_PAR_CAY_FIRST_RESULTS_RUNTIME_GUARD_BRIDGE; LES_PREUVES_PRECEDENTES_RESTENT_DANS_DIAGNOSTIC_READINESS_MAIS_NE_SONT_PAS_PUBLIEES_COMME_RESULTATS_CAY_TANT_QUE_BYTETRACK_ET_GMC_NE_SONT_PAS_PROUVES_ACTIFS'
    };
  }

  function apply(report,env=root){
    if(!report||typeof report!=='object')return report;
    const state=runtimeState(env);
    report.runtimeTrackingGuard=state;
    if(state.ok===true){
      if(report.firstResultsTestability)report.firstResultsTestability.runtimeTrackingReady=true;
      if(report.playerCards?.testability)report.playerCards.testability.runtimeTrackingReady=true;
      return report;
    }

    const reasons=Array.isArray(state.reasons)&&state.reasons.length?state.reasons:['TRACKING_RUNTIME_INDISPONIBLE'];
    const current=report.firstResultsTestability||report.playerCards?.testability||null;
    if(current){
      const blocked={
        ...current,
        diagnosticStatus:current.status||null,
        status:'INDISPONIBLE',
        coreTestable:false,
        physicalTestable:false,
        runtimeTrackingReady:false,
        runtimeBlockers:[...reasons],
        nextAction:BLOCKED_ACTION,
        policy:String(current.policy||'')+'; PUBLICATION_PREMIERS_RESULTATS_BLOQUEE_SI_LE_RUNTIME_TRACKING_STABLE_N_EST_PAS_PROUVE_ACTIF'
      };
      report.firstResultsTestability=blocked;
      if(report.playerCards)report.playerCards.testability=blocked;
    }

    if(report.playerCards&&Array.isArray(report.playerCards.players)){
      report.playerCards={
        ...report.playerCards,
        summary:{
          ...(report.playerCards.summary||{}),
          diagnosticStatus:report.playerCards.summary?.status||null,
          status:'INDISPONIBLE',
          runtimeTrackingReady:false,
          runtimeBlockers:[...reasons],
          nextAction:BLOCKED_ACTION
        },
        players:report.playerCards.players.map(card=>({
          ...card,
          firstResults:blockedReadiness(card?.firstResults,reasons)
        }))
      };
      if(report.firstResultsTestability)report.playerCards.testability=report.firstResultsTestability;
    }
    return report;
  }

  function install(env=root){
    const Bridge=env?.CAYStableTrackingBridge;
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayFirstResultsRuntimeGuardPatched)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){
      const instance=baseCreate(options);
      if(!instance||typeof instance.report!=='function')return instance;
      const baseReport=instance.report.bind(instance);
      instance.report=function(...args){
        return apply(baseReport(...args),env);
      };
      return instance;
    };
    Bridge.__cayFirstResultsRuntimeGuardPatched=true;
    return true;
  }

  install(root);
  return {VERSION,BLOCKED_ACTION,runtimeState,blockedReadiness,apply,install};
});
