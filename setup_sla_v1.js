(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYSetupSla=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REQUIRED=['team','roster','video','analysis','launch','firstResults'];
  const finite=v=>(typeof v==='number'||(typeof v==='string'&&v.trim()!==''))&&Number.isFinite(Number(v));
  const nonNegativeFinite=v=>finite(v)&&Number(v)>=0;
  function stage(input,key){
    const raw=input&&input[key]||{};
    const complete=raw.complete===true;
    const seconds=nonNegativeFinite(raw.seconds)?Number(raw.seconds):null;
    return {key,complete,seconds,blocker:complete?null:`ETAPE_${key.replace(/([A-Z])/g,'_$1').toUpperCase()}_INCOMPLETE`};
  }
  function evaluate(input={},options={}){
    const targetMinutes=finite(options.targetMinutes)&&Number(options.targetMinutes)>0&&Number.isFinite(Number(options.targetMinutes)*60)?Number(options.targetMinutes):20;
    const targetSeconds=targetMinutes*60;
    const stages=REQUIRED.map(key=>stage(input,key));
    const blockers=stages.filter(x=>!x.complete).map(x=>x.blocker);
    const completeTiming=stages.every(x=>x.seconds!==null);
    const rawTotal=completeTiming?stages.reduce((s,x)=>s+x.seconds,0):null;
    const measured=completeTiming&&Number.isFinite(rawTotal);
    const totalSeconds=measured?rawTotal:null;
    const complete=blockers.length===0;
    const withinTarget=complete&&measured&&totalSeconds<targetSeconds;
    const status=!complete?'INCOMPLET':!measured?'NON_MESURE':withinTarget?(targetMinutes===20?'PRET_MOINS_20_MIN':'PRET_DANS_SLA'):'HORS_SLA';
    return {version:'CAY_SETUP_SLA_V1',status,targetMinutes,targetSeconds,totalSeconds,complete,measured,withinTarget,blockers,stages,
      policy:'OBJECTIF_CAY_EQUIPE_PLUS_ANALYSE_PLUS_LANCEMENT_PLUS_ACCES_AUX_PREMIERS_RESULTATS_EN_MOINS_DE_20_MIN; BLANC_NEGATIF_OU_TOTAL_NON_FINI_RESTE_NON_MESURE; AUCUNE_DUREE_MANQUANTE_N_EST_INVENTEE; NON_MESURE_RESTE_EXPLICITE; LE_SLA_NE_PROMEUT_AUCUNE_METRIQUE_SPORTIVE'};
  }
  return {REQUIRED,evaluate};
});
