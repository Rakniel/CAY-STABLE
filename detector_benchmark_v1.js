(function(root){
'use strict';

const DEFAULT_MIN_COVERAGE=.82;
function finite(v){return v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;}
function asCount(v){const n=finite(v);return n===null?null:Math.max(0,Math.floor(n));}

function validateSpec(spec){
  if(!spec||!Array.isArray(spec.frames)||!spec.frames.length)throw new Error('benchmark frames required');
  const ids=new Set();
  for(const f of spec.frames){
    if(!f||!f.id)throw new Error('benchmark frame id required');
    if(ids.has(f.id))throw new Error('duplicate benchmark frame id: '+f.id);ids.add(f.id);
    const t=finite(f.time);if(t===null||t<0)throw new Error('invalid benchmark timestamp: '+f.id);
    const min=asCount(f.minOnPitch),max=asCount(f.maxOnPitch),maxOff=asCount(f.maxOffPitch);
    if(min===null&&max===null)throw new Error('benchmark expectation missing: '+f.id);
    if(min!==null&&max!==null&&min>max)throw new Error('invalid benchmark range: '+f.id);
    if(f.maxOffPitch!==undefined&&(finite(f.maxOffPitch)===null||Number(f.maxOffPitch)<0))throw new Error('invalid off-pitch maximum: '+f.id);
    if(maxOff!==null&&f.maxOffPitch===null)throw new Error('invalid off-pitch maximum: '+f.id);
  }
  return true;
}

function normalizeObservation(o){
  if(!o||!o.id)return null;
  const on=asCount(o.onPitchCount??o.onPitch??o.count);
  if(on===null)return null;
  const offRaw=o.offPitchCount??o.offPitch;
  const off=asCount(offRaw);
  return {id:String(o.id),onPitchCount:on,offPitchCount:off??0,offPitchReported:off!==null};
}

function evaluate(spec,observations,options){
  validateSpec(spec);
  const opt=options||{},minCoverage=finite(opt.minCoverage)??finite(spec.minCoverage)??DEFAULT_MIN_COVERAGE;
  const map=new Map();
  for(const raw of observations||[]){const o=normalizeObservation(raw);if(o)map.set(o.id,o);}
  const frames=[];let covered=0,required=0,emptyFalsePositives=0,criticalFailures=0,missing=0;
  let offPitchPolicyFrames=0,offPitchViolations=0,offPitchExcessDetections=0,missingOffPitchObservations=0;
  for(const f of spec.frames){
    const o=map.get(f.id),min=asCount(f.minOnPitch),max=asCount(f.maxOnPitch),maxOff=asCount(f.maxOffPitch);
    let pass=false,coverageContribution=1,reason='ok';
    if(maxOff!==null)offPitchPolicyFrames++;
    if(!o){pass=false;coverageContribution=0;reason='missing_observation';missing++;}
    else{
      if(min!==null){required+=min;coverageContribution=min>0?Math.min(1,o.onPitchCount/min):1;covered+=Math.min(o.onPitchCount,min);}
      if(max!==null&&min===null)coverageContribution=o.onPitchCount<=max?1:0;
      const minPass=min===null||o.onPitchCount>=min,maxPass=max===null||o.onPitchCount<=max;
      const offReportedPass=maxOff===null||o.offPitchReported===true;
      const offPass=maxOff===null||(offReportedPass&&o.offPitchCount<=maxOff);
      pass=minPass&&maxPass&&offPass;
      if(!minPass)reason='below_minimum';
      else if(!maxPass)reason='above_maximum';
      else if(!offReportedPass){reason='missing_off_pitch_observation';missingOffPitchObservations++;}
      else if(!offPass){
        reason='above_off_pitch_maximum';
        offPitchViolations++;
        offPitchExcessDetections+=Math.max(0,o.offPitchCount-maxOff);
      }
      if(max===0)emptyFalsePositives+=o.onPitchCount;
    }
    if(f.critical===true&&!pass)criticalFailures++;
    frames.push({id:f.id,time:f.time,critical:f.critical===true,onPitchCount:o?.onPitchCount??null,offPitchCount:o?.offPitchReported===true?o.offPitchCount:null,minOnPitch:min,maxOnPitch:max,maxOffPitch:maxOff,pass,reason,coverageContribution:+coverageContribution.toFixed(4)});
  }
  const activeCoverage=required>0?covered/required:1;
  const promotionEligible=missing===0&&missingOffPitchObservations===0&&criticalFailures===0&&emptyFalsePositives===0&&offPitchViolations===0&&activeCoverage>=minCoverage;
  return {version:'CAY_DETECTOR_BENCHMARK_V1',contractRevision:'1.1',frames,summary:{activeCoverage:+activeCoverage.toFixed(4),requiredMinimumDetections:required,coveredMinimumDetections:covered,emptyFalsePositives,criticalFailures,missingObservations:missing,offPitchPolicyFrames,offPitchViolations,offPitchExcessDetections,missingOffPitchObservations,minCoverage,promotionEligible}};
}

root.CAYDetectorBenchmarkV1={DEFAULT_MIN_COVERAGE,validateSpec,normalizeObservation,evaluate};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYDetectorBenchmarkV1;
})(typeof globalThis!=='undefined'?globalThis:this);
