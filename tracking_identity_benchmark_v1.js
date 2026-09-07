(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingIdentityBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const key=v=>String(v);

  function evaluateIdentityStability(observations,options={}){
    const rows=Array.isArray(observations)?observations:[];
    const totalSamples=rows.length;
    const valid=rows.filter(row=>row&&row.valid!==false&&row.gtId!==null&&row.gtId!==undefined&&row.trackId!==null&&row.trackId!==undefined&&finite(row.frame));
    const groups=new Map();
    for(const row of valid){
      const gt=key(row.gtId);
      if(!groups.has(gt))groups.set(gt,[]);
      groups.get(gt).push(row);
    }

    let idSwitches=0,comparableTransitions=0;
    const switches=[];
    const breakOnSegmentChange=options.breakOnSegmentChange!==false;
    const maxFrameGap=finite(options.maxFrameGap)?Math.max(1,Number(options.maxFrameGap)):Infinity;

    for(const [gtId,group] of groups){
      group.sort((a,b)=>Number(a.frame)-Number(b.frame));
      for(let i=1;i<group.length;i++){
        const prev=group[i-1],cur=group[i];
        if(breakOnSegmentChange&&prev.segment!==undefined&&cur.segment!==undefined&&prev.segment!==cur.segment)continue;
        const gap=Number(cur.frame)-Number(prev.frame);
        if(!(gap>0)||gap>maxFrameGap)continue;
        comparableTransitions++;
        if(key(prev.trackId)!==key(cur.trackId)){
          idSwitches++;
          switches.push({gtId,fromTrackId:prev.trackId,toTrackId:cur.trackId,fromFrame:Number(prev.frame),toFrame:Number(cur.frame),segment:cur.segment??prev.segment??null});
        }
      }
    }

    const coverage=totalSamples?valid.length/totalSamples:0;
    const identityConsistency=comparableTransitions?1-idSwitches/comparableTransitions:null;
    return {
      totalSamples,
      validSamples:valid.length,
      rejectedSamples:totalSamples-valid.length,
      gtIdentities:groups.size,
      comparableTransitions,
      idSwitches,
      identityConsistency:identityConsistency===null?null:+identityConsistency.toFixed(6),
      coverage:+coverage.toFixed(6),
      switches,
      status:comparableTransitions>0?'DISPONIBLE':'INDISPONIBLE',
      method:'CAY_LABELLED_IDENTITY_TRANSITION_BENCHMARK',
      policy:'DIAGNOSTIC_ONLY_NOT_HOTA_NOT_IDF1_REQUIRES_LABELLED_GT_ID_AND_TRACK_ID'
    };
  }

  return {evaluateIdentityStability};
});
