(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStaffVideoSource=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='CAY_STAFF_VIDEO_SOURCE_V1';
  const ALBERTVILLE_20261011=Object.freeze({
    matchId:'CAY-2026-10-11-UO-ALBERTVILLE',
    opponent:'U.O. Albertville',
    date:'2026-10-11',
    venue:'Stade Charles-Burdinat' // Source link is intentionally NOT committed: Veo shares can be unlisted.
  });
  function parseVeoLink(raw){
    if(typeof raw!=='string'||!raw.trim())return {valid:false,status:'INDISPONIBLE',reason:'VIDEO_URL_REQUIRED'};
    if(raw.length>512)return {valid:false,status:'INDISPONIBLE',reason:'VIDEO_URL_TOO_LONG'};
    let parsed;
    try{parsed=new URL(raw.trim());}catch(_){return {valid:false,status:'INDISPONIBLE',reason:'VIDEO_URL_INVALID'};}
    if(parsed.protocol!=='https:'||parsed.hostname!=='app.veo.co'||parsed.port||parsed.username||parsed.password||parsed.search||parsed.hash){
      return {valid:false,status:'INDISPONIBLE',reason:'VIDEO_URL_NOT_APPROVED'};
    }
    const match=/^\/matches\/([a-z0-9][a-z0-9-]{5,180})\/?$/.exec(parsed.pathname);
    if(!match)return {valid:false,status:'INDISPONIBLE',reason:'VEO_MATCH_PATH_INVALID'};
    const slug=match[1];
    return {
      version:VERSION,
      valid:true,
      status:'REFERENCE_EXTERNE',
      provider:'VEO',
      url:'https://app.veo.co/matches/'+slug,
      sourceVideoId:'veo:'+slug,
      playableInAnalyzer:false,
      analyzedByCAY:false,
      videoCoverage:null,
      evidenceStatus:'INDISPONIBLE',
      importRequirement:'EXPORT_MP4_AUTORISE_REQUIS',
      policy:'LIEN_REFERENCE_UNIQUEMENT; AUCUNE_STATISTIQUE_INFERÉE_DEPUIS_LE_LIEN'
    };
  }
  function canBindToObservations(link,observations=[]){
    const parsed=parseVeoLink(link);
    if(!parsed.valid)return {...parsed,compatible:false};
    const rows=Array.isArray(observations)?observations:[];
    const conflicts=rows.filter(row=>row&&row.sourceVideoId&&String(row.sourceVideoId)!==parsed.sourceVideoId);
    return {...parsed,compatible:conflicts.length===0,reason:conflicts.length?'OBSERVATIONS_SOURCE_CONFLICT':null};
  }
  return {VERSION,ALBERTVILLE_20261011,parseVeoLink,canBindToObservations};
});
