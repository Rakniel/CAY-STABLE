(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYSetupSla=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REQUIRED=['team','roster','video','analysis','launch'];
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  function stage(input,key){
    const raw=input&&input[key]||{};
    const complete=raw.complete===true;
    const seconds=finite(raw.seconds)?Math.max(0,Number(raw.seconds)):null;
    return {key,complete,seconds,blocker:complete?null:`ETAPE_${key.toUpperCase()}_INCOMPLETE`};
  }
  function evaluate(input={},options={}){
    const targetMinutes=finite(options.targetMinutes)?Math.max(1,Number(options.targetMinutes)):20;
    const targetSeconds=targetMinutes*60;
    const stages=REQUIRED.map(key=>stage(input,key));
    const blockers=stages.filter(x=>!x.complete).map(x=>x.blocker);
    const measured=stages.every(x=>x.seconds!==null);
    const totalSeconds=measured?stages.reduce((s,x)=>s+x.seconds,0):null;
    const complete=blockers.length===0;
    const withinTarget=complete&&measured&&totalSeconds<=targetSeconds;
    const status=!complete?'INCOMPLET':!measured?'NON_MESURE':withinTarget?(targetMinutes===20?'PRET_MOINS_20_MIN':'PRET_DANS_SLA'):'HORS_SLA';
    return {version:'CAY_SETUP_SLA_V1',status,targetMinutes,targetSeconds,totalSeconds,complete,measured,withinTarget,blockers,stages,
      policy:'OBJECTIF_CAY_EQUIPE_PLUS_ANALYSE_PLUS_LANCEMENT_EN_20_MIN_MAX; AUCUNE_DUREE_MANQUANTE_N_EST_INVENTEE; NON_MESURE_RESTE_EXPLICITE; LE_SLA_NE_PROMEUT_AUCUNE_METRIQUE_SPORTIVE'};
  }
  return {REQUIRED,evaluate};
});
