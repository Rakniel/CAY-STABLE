(function(root,factory){
  const api=factory(root.CAYMetricPitchHeatmap);
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./metric_pitch_heatmap_v1.js'));
  else root.CAYMetricAttackingDirection=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(PitchHeatmap){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  function normalizeDirection(value){
    const v=String(value??'').trim().toUpperCase().replace(/[-\s]/g,'_');
    if(v==='LTR'||v==='LEFT_TO_RIGHT')return 'LEFT_TO_RIGHT';
    if(v==='RTL'||v==='RIGHT_TO_LEFT')return 'RIGHT_TO_LEFT';
    return null;
  }
  function normalizePoint(point,direction,options){
    const opts={pitchLengthM:105,pitchWidthM:68,...(options||{})};
    if(!point||!finite(point.x)||!finite(point.y))return null;
    const dir=normalizeDirection(direction);
    if(!dir)return null;
    const length=Math.max(1,Number(opts.pitchLengthM)||105),width=Math.max(1,Number(opts.pitchWidthM)||68);
    const x=Number(point.x),y=Number(point.y);
    if(x<0||x>length||y<0||y>width)return null;
    if(dir==='LEFT_TO_RIGHT')return {x,y,direction:dir,mirrored:false};
    return {x:length-x,y:width-y,direction:dir,mirrored:true};
  }
  function directionOf(sample,options){
    if(typeof options?.directionResolver==='function'){
      try{return normalizeDirection(options.directionResolver(sample));}catch(e){return null;}
    }
    return normalizeDirection(sample?.attackingDirection??sample?.attackDirection??sample?.direction);
  }
  function wrapProjectors(projectors,options){
    const wrapped={};
    for(const [segment,entry] of Object.entries(projectors||{})){
      if(!entry||entry.validated!==true||typeof entry.project!=='function'){
        wrapped[segment]=entry;
        continue;
      }
      wrapped[segment]={...entry,project(sample){
        let raw=null;
        try{raw=entry.project(sample);}catch(e){return null;}
        const dir=directionOf(sample,options);
        const normalized=normalizePoint(raw,dir,options);
        if(!normalized)return null;
        return {x:normalized.x,y:normalized.y};
      }};
    }
    return wrapped;
  }
  function buildAttackingHeatmap(track,projectors,options){
    if(!PitchHeatmap||typeof PitchHeatmap.build!=='function')return {status:'INDISPONIBLE',reason:'METRIC_PITCH_HEATMAP_ENGINE_UNAVAILABLE',coordinateSystem:'PITCH_METERS_CAY_ATTACKS_LEFT_TO_RIGHT'};
    const normalizedProjectors=wrapProjectors(projectors,options);
    const result=PitchHeatmap.build(track,normalizedProjectors,options);
    const trajectory=result?.trajectory?{
      ...result.trajectory,
      coordinateSystem:'PITCH_METERS_CAY_ATTACKS_LEFT_TO_RIGHT',
      attackingDirectionNormalized:true
    }:result?.trajectory;
    return {
      ...result,
      trajectory,
      coordinateSystem:'PITCH_METERS_CAY_ATTACKS_LEFT_TO_RIGHT',
      attackingDirectionNormalized:true,
      normalizationRequiresExplicitDirection:true,
      attackingDirectionPolicy:'EXPLICITE_PAR_OBSERVATION_OU_RESOLVER; AUCUNE_DIRECTION_DEVINEE; RTL_MIROIR_X_ET_Y; COORDONNEES_BRUTES_INCHANGEES',
      provenance:'SOCCERACTION_SPADL_PLAY_LEFT_TO_RIGHT_PATTERN_ADAPTED_CLEAN_ROOM_NO_UPSTREAM_CODE_COPIED'
    };
  }
  return {normalizeDirection,normalizePoint,directionOf,wrapProjectors,buildAttackingHeatmap};
});
