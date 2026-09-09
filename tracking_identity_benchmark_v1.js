(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingIdentityBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const key=v=>String(v);
  const round=v=>Number.isFinite(Number(v))?+Number(v).toFixed(6):null;

  function evaluateIdentityStability(observations,options={}){
    const rows=Array.isArray(observations)?observations:[];
    const totalSamples=rows.length;
    const labelled=rows.filter(row=>row&&row.valid!==false&&row.gtId!==null&&row.gtId!==undefined&&finite(row.frame));
    const valid=labelled.filter(row=>row.trackId!==null&&row.trackId!==undefined);
    const groups=new Map();
    for(const row of labelled){
      const gt=key(row.gtId);
      if(!groups.has(gt))groups.set(gt,[]);
      groups.get(gt).push(row);
    }

    let idSwitches=0,comparableTransitions=0,fragments=0,reacquisitions=0;
    const switches=[],fragmentEvents=[];
    const breakOnSegmentChange=options.breakOnSegmentChange!==false;
    const maxFrameGap=finite(options.maxFrameGap)?Math.max(1,Number(options.maxFrameGap)):Infinity;

    for(const [gtId,group] of groups){
      group.sort((a,b)=>Number(a.frame)-Number(b.frame));
      let lastTracked=null,missingSinceTrack=false;
      for(let i=0;i<group.length;i++){
        const cur=group[i];
        const curTracked=cur.trackId!==null&&cur.trackId!==undefined;
        if(i>0){
          const prev=group[i-1];
          const segmentBreak=breakOnSegmentChange&&prev.segment!==undefined&&cur.segment!==undefined&&prev.segment!==cur.segment;
          const gap=Number(cur.frame)-Number(prev.frame);
          const continuous=!segmentBreak&&gap>0&&gap<=maxFrameGap;
          const prevTracked=prev.trackId!==null&&prev.trackId!==undefined;
          if(prevTracked&&curTracked&&continuous){
            comparableTransitions++;
            if(key(prev.trackId)!==key(cur.trackId)){
              idSwitches++;
              switches.push({gtId,fromTrackId:prev.trackId,toTrackId:cur.trackId,fromFrame:Number(prev.frame),toFrame:Number(cur.frame),segment:cur.segment??prev.segment??null});
            }
          }
          if(!continuous){lastTracked=null;missingSinceTrack=false;}
        }

        if(curTracked){
          if(missingSinceTrack&&lastTracked){
            fragments++;reacquisitions++;
            fragmentEvents.push({gtId,fromTrackId:lastTracked.trackId,toTrackId:cur.trackId,fromFrame:Number(lastTracked.frame),toFrame:Number(cur.frame),segment:cur.segment??lastTracked.segment??null});
          }
          lastTracked=cur;missingSinceTrack=false;
        }else if(lastTracked){
          const sameSegment=!breakOnSegmentChange||lastTracked.segment===undefined||cur.segment===undefined||lastTracked.segment===cur.segment;
          const gap=Number(cur.frame)-Number(lastTracked.frame);
          if(sameSegment&&gap>0&&gap<=maxFrameGap)missingSinceTrack=true;
          else{lastTracked=null;missingSinceTrack=false;}
        }
      }
    }

    const coverage=totalSamples?valid.length/totalSamples:0;
    const labelledCoverage=labelled.length?valid.length/labelled.length:0;
    const identityConsistency=comparableTransitions?1-idSwitches/comparableTransitions:null;
    return {
      totalSamples,
      labelledSamples:labelled.length,
      validSamples:valid.length,
      rejectedSamples:totalSamples-valid.length,
      gtIdentities:groups.size,
      comparableTransitions,
      idSwitches,
      fragments,
      reacquisitions,
      identityConsistency:identityConsistency===null?null:round(identityConsistency),
      coverage:round(coverage),
      labelledCoverage:round(labelledCoverage),
      switches,
      fragmentEvents,
      status:comparableTransitions>0||labelled.length>1?'DISPONIBLE':'INDISPONIBLE',
      method:'CAY_LABELLED_IDENTITY_TRANSITION_BENCHMARK',
      policy:'DIAGNOSTIC_ONLY_NOT_HOTA_NOT_IDF1_REQUIRES_LABELLED_GT_ID; ID_SWITCHES_ET_FRAGMENTATIONS_NE_TRAVERSENT_PAS_LES_FRONTIERES_DE_SEGMENT_PAR_DEFAUT'
    };
  }

  function compareIdentityStability(before,after,options={}){
    const a=before&&before.method?before:evaluateIdentityStability(before,options);
    const b=after&&after.method?after:evaluateIdentityStability(after,options);
    const delta=(field)=>finite(a?.[field])&&finite(b?.[field])?round(Number(b[field])-Number(a[field])):null;
    const noRegression=Number(b.labelledCoverage)>=Number(a.labelledCoverage)&&Number(b.idSwitches)<=Number(a.idSwitches)&&Number(b.fragments)<=Number(a.fragments);
    const strictGain=Number(b.labelledCoverage)>Number(a.labelledCoverage)||Number(b.idSwitches)<Number(a.idSwitches)||Number(b.fragments)<Number(a.fragments);
    return {
      version:'CAY_TRACKING_IDENTITY_BENCHMARK_COMPARE_V1',
      before:a,after:b,
      deltaLabelledCoverage:delta('labelledCoverage'),
      deltaIdentityConsistency:delta('identityConsistency'),
      deltaIdSwitches:Number(b.idSwitches)-Number(a.idSwitches),
      deltaFragments:Number(b.fragments)-Number(a.fragments),
      improved:noRegression&&strictGain,
      policy:'PROMOTION_DIAGNOSTIQUE_PARETO: COUVERTURE_ANNotee_NE_BAISSE_PAS; ID_SWITCHES_ET_FRAGMENTATIONS_NE_AUGMENTENT_PAS; AU_MOINS_UN_AXE_DOIT_STRICTEMENT_S_AMELIORER'
    };
  }

  return {evaluateIdentityStability,compareIdentityStability};
});
