(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableTrackingRuntimeGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='CAY_STABLE_TRACKING_RUNTIME_GUARD_V1';

  function verdict(env=root){
    const twoStage=env?.CAYTrackingCore?.__cayTwoStagePatched===true;
    const cameraConsensus=env?.CAYStableTrackingBridge?.__cayCameraConsensusPatched===true;
    const reasons=[];
    if(!twoStage)reasons.push('TWO_STAGE_BYTETRACK_RUNTIME_NOT_PATCHED');
    if(!cameraConsensus)reasons.push('CAMERA_MOTION_CONSENSUS_NOT_PATCHED');
    return {
      version:VERSION,
      ok:twoStage&&cameraConsensus,
      twoStage,
      cameraConsensus,
      backend:twoStage?'CAY_TWO_STAGE_BYTETRACK_ADAPTED':'CAY_CORE_FALLBACK_BLOCKED',
      cameraMotion:cameraConsensus?'CAY_BOTSORT_STYLE_CONSENSUS':'INDISPONIBLE',
      reasons,
      policy:'FAIL_CLOSED; LE_BUILD_STABLE_NE_DOIT_JAMAIS_RETOMBER_SILENCIEUSEMENT_SUR_LE_TRACKER_HISTORIQUE_SI_LA_CASCADE_DE_CONFIANCE_OU_LA_COMPENSATION_MOUVEMENT_CAMERA_N_EST_PAS_INSTALLEE'
    };
  }

  function install(env=root,doc=env?.document){
    const state=verdict(env);
    env.CAYStableTrackingRuntimeGuardState=state;
    if(!doc||typeof doc.getElementById!=='function')return state;
    const button=doc.getElementById('runTracking');
    const statusEl=doc.getElementById('trackingStatus');
    if(button){
      button.dataset=button.dataset||{};
      button.dataset.cayRuntimeGuard=state.ok?'READY':'BLOCKED';
      if(!state.ok)button.disabled=true;
    }
    if(!state.ok){
      const message='Tracking STABLE : INDISPONIBLE — runtime ByteTrack/GMC incomplet ('+state.reasons.join(', ')+'). Aucun fallback silencieux.';
      if(typeof env.status==='function')env.status(statusEl,message,'warning');
      else if(statusEl)statusEl.textContent=message;
    }
    return state;
  }

  function autoInstall(){
    if(typeof document==='undefined')return verdict(root);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>install(root,document),{once:true});
    else return install(root,document);
    return null;
  }

  autoInstall();
  return {VERSION,verdict,install,autoInstall};
});
