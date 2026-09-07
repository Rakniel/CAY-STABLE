(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats,
    typeof module==='object'&&module.exports ? require('./metric_pitch_heatmap_v1.js') : root.CAYMetricPitchHeatmap,
    typeof module==='object'&&module.exports ? require('./metric_quality_guard_v1.js') : root.CAYMetricQualityGuard
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricAnchorEvidenceGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(PlayerStats,MetricHeatmap,MetricQualityGuard){
  'use strict';

  const VERSION='CAY_METRIC_ANCHOR_EVIDENCE_GUARD_V1';
  const PERSON_GROUND_ANCHORS=new Set(['bbox_bottom_center','bottom_center','foot_point','ground_contact','pose_ankle_midpoint','mask_bottom_center']);
  const BALL_CENTER_ANCHORS=new Set(['bbox_center','center','ball_center','mask_center']);
  const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
  const normalizeKind=v=>String(v==null?'':v).trim().toLowerCase();

  function roleForTrack(track){
    const cat=String(track?.cat||track?.category||'').trim().toLowerCase();
    return cat==='ball'?'ball':'person';
  }

  function evaluatePoint(point,role='person'){
    const sourceTrackExplicit=present(point?.sourceTrackId);
    const kind=normalizeKind(point?.anchorKind);
    if(!kind){
      if(sourceTrackExplicit)return {eligible:false,explicit:false,kind:null,reason:'EXTERNAL_ANCHOR_KIND_REQUIRED'};
      return {eligible:true,explicit:false,kind:null,reason:'LEGACY_ANCHOR_UNSPECIFIED'};
    }
    const accepted=role==='ball'?BALL_CENTER_ANCHORS:PERSON_GROUND_ANCHORS;
    if(accepted.has(kind))return {eligible:true,explicit:true,kind,reason:null};
    return {eligible:false,explicit:true,kind,reason:role==='ball'?'BALL_CENTER_ANCHOR_REQUIRED':'PERSON_GROUND_CONTACT_ANCHOR_REQUIRED'};
  }

  function summarize(track,role=roleForTrack(track)){
    const path=Array.isArray(track?.fullPath)?track.fullPath:[];
    let acceptedExplicit=0,rejectedExplicit=0,rejectedMissingExternal=0,legacyUnspecified=0;
    const rejectedKinds={};
    for(const point of path){
      const ev=evaluatePoint(point,role);
      if(ev.explicit&&ev.eligible)acceptedExplicit++;
      else if(ev.explicit&&!ev.eligible){rejectedExplicit++;rejectedKinds[ev.kind]=(rejectedKinds[ev.kind]||0)+1;}
      else if(!ev.eligible&&ev.reason==='EXTERNAL_ANCHOR_KIND_REQUIRED')rejectedMissingExternal++;
      else legacyUnspecified++;
    }
    const explicitEvidence=acceptedExplicit+rejectedExplicit+rejectedMissingExternal;
    const accepted=acceptedExplicit+legacyUnspecified;
    return {
      version:VERSION,role,totalObservations:path.length,acceptedObservations:accepted,
      acceptedExplicitObservations:acceptedExplicit,rejectedExplicitObservations:rejectedExplicit,
      rejectedMissingExternalAnchorObservations:rejectedMissingExternal,legacyUnspecifiedObservations:legacyUnspecified,
      explicitAnchorEvidenceCoverage:path.length?+((explicitEvidence/path.length)).toFixed(4):0,
      acceptedAnchorCoverage:path.length?+((accepted/path.length)).toFixed(4):0,
      rejectedKinds,
      policy:role==='ball'?'EXTERNAL_BALL_OBSERVATIONS_REQUIRE_EXPLICIT_CENTER_ANCHOR':'EXTERNAL_PERSON_OBSERVATIONS_REQUIRE_EXPLICIT_GROUND_CONTACT_ANCHOR; LEGACY_INTERNAL_POINTS_REMAIN_BACKWARD_COMPATIBLE'
    };
  }

  function guardedProjectors(projectors,role='person'){
    const source=projectors&&typeof projectors==='object'?projectors:{};
    const out={};
    for(const [key,entry] of Object.entries(source)){
      if(!entry||typeof entry!=='object'||typeof entry.project!=='function'){out[key]=entry;continue;}
      const project=entry.project.bind(entry);
      out[key]={...entry,project(point){
        const evidence=evaluatePoint(point,role);
        if(!evidence.eligible)return null;
        return project(point);
      }};
    }
    return out;
  }

  function attach(result,evidence){
    if(!result||typeof result!=='object')return result;
    return {...result,anchorEvidence:evidence,anchorEvidencePolicy:evidence.policy};
  }

  function patch(){
    if(MetricHeatmap&&typeof MetricHeatmap.build==='function'&&!MetricHeatmap.__cayAnchorEvidenceGuardPatched){
      const original=MetricHeatmap.build.bind(MetricHeatmap);
      MetricHeatmap.build=function(track,projectors,options){
        const role=roleForTrack(track),evidence=summarize(track,role);
        return attach(original(track,guardedProjectors(projectors,role),options),evidence);
      };
      MetricHeatmap.__cayAnchorEvidenceGuardPatched=true;
    }
    if(MetricQualityGuard&&typeof MetricQualityGuard.robustMetricForTrack==='function'&&!MetricQualityGuard.__cayAnchorEvidenceGuardPatched){
      const original=MetricQualityGuard.robustMetricForTrack.bind(MetricQualityGuard);
      MetricQualityGuard.robustMetricForTrack=function(track,projectors){
        const role=roleForTrack(track),evidence=summarize(track,role);
        return attach(original(track,guardedProjectors(projectors,role)),evidence);
      };
      MetricQualityGuard.__cayAnchorEvidenceGuardPatched=true;
    }
    if(PlayerStats&&typeof PlayerStats.metricForTrack==='function'&&!PlayerStats.__cayAnchorEvidenceMetricPatched){
      const original=PlayerStats.metricForTrack.bind(PlayerStats);
      PlayerStats.metricForTrack=function(track,projectors){
        const role=roleForTrack(track),evidence=summarize(track,role);
        return attach(original(track,guardedProjectors(projectors,role)),evidence);
      };
      PlayerStats.__cayAnchorEvidenceMetricPatched=true;
    }
    if(PlayerStats&&typeof PlayerStats.buildReport==='function'&&!PlayerStats.__cayAnchorEvidenceReportPatched){
      const original=PlayerStats.buildReport.bind(PlayerStats);
      PlayerStats.buildReport=function(coreState,coreApi,projectors){
        const report=original(coreState,coreApi,guardedProjectors(projectors,'person'));
        const rawById=new Map([...(coreState?.archive||[]),...(coreState?.active||[])].map(t=>[t.globalId,t]));
        for(const player of report?.players||[]){
          const raw=rawById.get(player.id);if(!raw)continue;
          const evidence=summarize(raw,'person');
          if(player.metric&&typeof player.metric==='object')player.metric.anchorEvidence=evidence;
          if(player.heatmap&&typeof player.heatmap==='object')player.heatmap.anchorEvidence=evidence;
        }
        report.metricAnchorEvidenceGuard={version:VERSION,policy:'PHYSICAL_METRICS_FAIL_CLOSED_FOR_EXTERNAL_TRACKS_WITH_MISSING_OR_NON_GROUND_PERSON_ANCHORS'};
        return report;
      };
      PlayerStats.__cayAnchorEvidenceReportPatched=true;
    }
    return true;
  }

  patch();
  return {VERSION,PERSON_GROUND_ANCHORS:[...PERSON_GROUND_ANCHORS],BALL_CENTER_ANCHORS:[...BALL_CENTER_ANCHORS],roleForTrack,evaluatePoint,summarize,guardedProjectors,attach,patch};
});
