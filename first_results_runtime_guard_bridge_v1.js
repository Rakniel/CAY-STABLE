(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsRuntimeGuardBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='CAY_FIRST_RESULTS_RUNTIME_GUARD_BRIDGE_V1';
  const BLOCKED_ACTION='RETABLIR_RUNTIME_TRACKING_STABLE';
  const COVERAGE_ACTION='AMELIORER_COUVERTURE_ANALYSE';

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

  function observationState(report){
    const bridge=report?.bridge||{};
    const attempted=Number(bridge.attemptedObservationFrames);
    if(!(Number.isFinite(attempted)&&attempted>0))return {available:false,quality:null,coverage:null,attempted:0,usable:null,unavailable:null,reasons:{}};
    const coverage=Number(bridge.observationCoverage);
    const normalizedCoverage=Number.isFinite(coverage)?Math.max(0,Math.min(1,coverage)):0;
    const declared=String(bridge.observationQuality||'').trim().toUpperCase();
    const quality=['FIABLE','PARTIEL','INDISPONIBLE'].includes(declared)
      ?declared
      :(normalizedCoverage>=.8?'FIABLE':(normalizedCoverage>0?'PARTIEL':'INDISPONIBLE'));
    return {
      available:true,
      quality,
      coverage:normalizedCoverage,
      attempted,
      usable:Number.isFinite(Number(bridge.usableObservationFrames))?Number(bridge.usableObservationFrames):null,
      unavailable:Number.isFinite(Number(bridge.unavailableObservationFrames))?Number(bridge.unavailableObservationFrames):null,
      reasons:{...(bridge.unavailableReasons||{})}
    };
  }

  function blockedReadiness(readiness,reasons,action=BLOCKED_ACTION){
    const source=readiness&&typeof readiness==='object'?readiness:{};
    const runtimeTrackingReady=action===BLOCKED_ACTION?false:true;
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
      runtimeTrackingReady,
      observationCoverageReady:action===COVERAGE_ACTION?false:source.observationCoverageReady,
      runtimeBlockers:[...reasons],
      nextAction:action,
      policy:'PUBLICATION_FAIL_CLOSED_PAR_CAY_FIRST_RESULTS_RUNTIME_GUARD_BRIDGE; LES_PREUVES_PRECEDENTES_RESTENT_DANS_DIAGNOSTIC_READINESS_MAIS_NE_SONT_PAS_PUBLIEES_COMME_RESULTATS_CAY_TANT_QUE_LES_PREUVES_RUNTIME_ET_COUVERTURE_NE_SONT_PAS_DEFENDABLES'
    };
  }

  function blockPhysicalReadiness(readiness,observation){
    const source=readiness&&typeof readiness==='object'?readiness:{};
    const visualReady=source.tracking===true&&source.trajectory===true&&source.heatmap===true;
    return {
      ...source,
      diagnosticReadiness:{...source},
      diagnosticStatus:source.status||null,
      status:visualReady?'PITCH_VISUAL_TESTABLE':(source.tracking===true?'TRACKING_TESTABLE':'INDISPONIBLE'),
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
      metricReady:false,
      runtimeTrackingReady:true,
      observationCoverageReady:false,
      observationCoverageQuality:observation.quality,
      observationCoverage:observation.coverage,
      runtimeBlockers:['OBSERVATION_COVERAGE_NOT_FIABLE'],
      nextAction:COVERAGE_ACTION,
      policy:'METRIQUES_PHYSIQUES_NON_PUBLIEES_TANT_QUE_LA_COUVERTURE_GLOBALE_DES_FRAMES_TENTEES_N_EST_PAS_FIABLE; TRAJECTOIRE_ET_HEATMAP_RESTANTES_PUBLIEES_SEULEMENT_SI_LEUR_PREUVE_CANONIQUE_EXISTE'
    };
  }

  function applyObservationGuard(report,observation){
    if(!observation.available)return report;
    report.observationCoverageGuard={
      version:'CAY_FIRST_RESULTS_OBSERVATION_COVERAGE_GUARD_V1',
      ...observation,
      physicalResultsAllowed:observation.quality==='FIABLE',
      visualResultsAllowed:observation.quality!=='INDISPONIBLE',
      policy:'REUTILISE_LA_QUALITE_DU_STRICT_TRACKING_FRAME_GUARD; FIABLE_AUTORISE_PHYSIQUE, PARTIEL_BLOQUE_PHYSIQUE, INDISPONIBLE_BLOQUE_TOUS_PREMIERS_RESULTATS'
    };
    if(observation.quality==='FIABLE'){
      if(report.firstResultsTestability)report.firstResultsTestability.observationCoverageReady=true;
      if(report.playerCards?.testability)report.playerCards.testability.observationCoverageReady=true;
      return report;
    }
    if(observation.quality==='INDISPONIBLE'){
      const reasons=['OBSERVATION_COVERAGE_INDISPONIBLE'];
      const current=report.firstResultsTestability||report.playerCards?.testability||null;
      if(current){
        const blocked={
          ...current,
          diagnosticStatus:current.status||null,
          status:'INDISPONIBLE',
          coreTestable:false,
          physicalTestable:false,
          runtimeTrackingReady:true,
          observationCoverageReady:false,
          observationCoverageQuality:observation.quality,
          observationCoverage:observation.coverage,
          runtimeBlockers:reasons,
          nextAction:COVERAGE_ACTION,
          policy:String(current.policy||'')+'; PREMIERS_RESULTATS_BLOQUES_SI_AUCUNE_FRAME_TENTEE_N_EST_EXPLOITABLE'
        };
        report.firstResultsTestability=blocked;
        if(report.playerCards)report.playerCards.testability=blocked;
      }
      if(report.playerCards&&Array.isArray(report.playerCards.players)){
        report.playerCards={
          ...report.playerCards,
          summary:{...(report.playerCards.summary||{}),diagnosticStatus:report.playerCards.summary?.status||null,status:'INDISPONIBLE',runtimeTrackingReady:true,observationCoverageReady:false,observationCoverageQuality:observation.quality,observationCoverage:observation.coverage,nextAction:COVERAGE_ACTION},
          players:report.playerCards.players.map(card=>({...card,firstResults:blockedReadiness(card?.firstResults,reasons,COVERAGE_ACTION)}))
        };
        if(report.firstResultsTestability)report.playerCards.testability=report.firstResultsTestability;
      }
      return report;
    }

    const current=report.firstResultsTestability||report.playerCards?.testability||null;
    if(current){
      const physicalWasReady=current.status==='PHYSICAL_TESTABLE'||current.physicalTestable===true;
      const downgraded={
        ...current,
        diagnosticStatus:current.status||null,
        status:physicalWasReady?'PITCH_VISUAL_TESTABLE':current.status,
        physicalTestable:false,
        runtimeTrackingReady:true,
        observationCoverageReady:false,
        observationCoverageQuality:observation.quality,
        observationCoverage:observation.coverage,
        runtimeBlockers:['OBSERVATION_COVERAGE_NOT_FIABLE'],
        nextAction:COVERAGE_ACTION,
        policy:String(current.policy||'')+'; METRIQUES_PHYSIQUES_BLOQUEES_TANT_QUE_LA_COUVERTURE_ANALYSE_EST_PARTIELLE'
      };
      report.firstResultsTestability=downgraded;
      if(report.playerCards)report.playerCards.testability=downgraded;
    }
    if(report.playerCards&&Array.isArray(report.playerCards.players)){
      report.playerCards={
        ...report.playerCards,
        summary:{...(report.playerCards.summary||{}),diagnosticStatus:report.playerCards.summary?.status||null,status:report.firstResultsTestability?.status||report.playerCards.summary?.status||'PARTIEL',runtimeTrackingReady:true,observationCoverageReady:false,observationCoverageQuality:observation.quality,observationCoverage:observation.coverage,nextAction:COVERAGE_ACTION},
        players:report.playerCards.players.map(card=>({...card,firstResults:blockPhysicalReadiness(card?.firstResults,observation)}))
      };
      if(report.firstResultsTestability)report.playerCards.testability=report.firstResultsTestability;
    }
    return report;
  }

  function apply(report,env=root){
    if(!report||typeof report!=='object')return report;
    const state=runtimeState(env);
    report.runtimeTrackingGuard=state;
    if(state.ok===true){
      if(report.firstResultsTestability)report.firstResultsTestability.runtimeTrackingReady=true;
      if(report.playerCards?.testability)report.playerCards.testability.runtimeTrackingReady=true;
      return applyObservationGuard(report,observationState(report));
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
  return {VERSION,BLOCKED_ACTION,COVERAGE_ACTION,runtimeState,observationState,blockedReadiness,blockPhysicalReadiness,applyObservationGuard,apply,install};
});