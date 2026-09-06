(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYSkillCornerTrackingBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const DEFAULT_FPS=10;
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const cleanId=v=>v===null||v===undefined||String(v).trim()===''?null:String(v);

  function frameTimeSec(frame,index,fps){
    if(finite(frame?.frame))return Number(frame.frame)/fps;
    return index/fps;
  }

  function buildPlayerTracks(frames,options){
    const cfg={fps:DEFAULT_FPS,includeExtrapolated:false,period:null,...(options||{})};
    const fps=finite(cfg.fps)&&Number(cfg.fps)>0?Number(cfg.fps):DEFAULT_FPS;
    const source=Array.isArray(frames)?frames:[];
    const tracks=new Map();
    const diagnostics={
      source:'SKILLCORNER_OPEN_DATA',
      sourceFps:fps,
      totalFrames:source.length,
      acceptedFrames:0,
      playerRows:0,
      detectedRows:0,
      extrapolatedRows:0,
      extrapolatedEvidenceGaps:0,
      invalidRows:0,
      duplicatePlayerRows:0,
      includeExtrapolated:cfg.includeExtrapolated===true,
      observationPolicy:cfg.includeExtrapolated===true?'DETECTED_AND_EXTRAPOLATED_REFERENCE':'DETECTED_ONLY_EXTRAPOLATED_AS_EVIDENCE_GAP'
    };

    source.forEach((frame,index)=>{
      const period=finite(frame?.period)?Number(frame.period):1;
      if(cfg.period!==null&&cfg.period!==undefined&&Number(cfg.period)!==period)return;
      const time=frameTimeSec(frame,index,fps);
      if(!finite(time))return;
      diagnostics.acceptedFrames++;
      const seenInFrame=new Set();
      for(const player of Array.isArray(frame?.player_data)?frame.player_data:[]){
        diagnostics.playerRows++;
        const playerId=cleanId(player?.player_id);
        if(!playerId||!finite(player?.x)||!finite(player?.y)){
          diagnostics.invalidRows++;
          continue;
        }
        if(seenInFrame.has(playerId)){
          diagnostics.duplicatePlayerRows++;
          continue;
        }
        seenInFrame.add(playerId);
        const detected=player?.is_detected===true;
        if(detected)diagnostics.detectedRows++;else diagnostics.extrapolatedRows++;
        if(!tracks.has(playerId))tracks.set(playerId,{playerId,fullPath:[],detectedObservations:0,extrapolatedObservations:0});
        const track=tracks.get(playerId);
        if(detected){
          track.detectedObservations++;
          track.fullPath.push({x:Number(player.x),y:Number(player.y),time:Number(time),segment:period,benchmarkSource:'SKILLCORNER_OPEN_DATA',sourceDetected:true,frame:finite(frame?.frame)?Number(frame.frame):null});
        }else{
          track.extrapolatedObservations++;
          if(cfg.includeExtrapolated===true){
            track.fullPath.push({x:Number(player.x),y:Number(player.y),time:Number(time),segment:period,benchmarkSource:'SKILLCORNER_OPEN_DATA',sourceDetected:false,frame:finite(frame?.frame)?Number(frame.frame):null});
          }else{
            diagnostics.extrapolatedEvidenceGaps++;
            track.fullPath.push({x:null,y:null,time:Number(time),segment:period,benchmarkSource:'SKILLCORNER_OPEN_DATA',sourceDetected:false,referenceX:Number(player.x),referenceY:Number(player.y),frame:finite(frame?.frame)?Number(frame.frame):null,evidenceGapReason:'SKILLCORNER_EXTRAPOLATED_NOT_OBSERVED'});
          }
        }
      }
    });

    const out=[...tracks.values()].map(track=>{
      track.fullPath.sort((a,b)=>a.time-b.time||a.segment-b.segment);
      const total=track.detectedObservations+track.extrapolatedObservations;
      return {...track,detectedCoverage:total?+(track.detectedObservations/total).toFixed(4):0};
    }).sort((a,b)=>a.playerId.localeCompare(b.playerId,undefined,{numeric:true}));

    return {tracks:out,diagnostics};
  }

  function metricProjectors(tracks){
    const segments=new Set();
    for(const track of Array.isArray(tracks)?tracks:[]){
      for(const p of Array.isArray(track?.fullPath)?track.fullPath:[])if(finite(p?.segment))segments.add(Number(p.segment));
    }
    const projectors={};
    for(const segment of segments){
      projectors[segment]={validated:true,confidence:1,source:'SKILLCORNER_REFERENCE_METERS',project:p=>({x:p?.x,y:p?.y})};
    }
    return projectors;
  }

  return {DEFAULT_FPS,buildPlayerTracks,metricProjectors};
});
