(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYReIDEvidenceFusion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function cosine(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||!a.length)return null;
    let dot=0,na=0,nb=0;
    for(let i=0;i<a.length;i++){
      const x=Number(a[i]),y=Number(b[i]);
      if(!Number.isFinite(x)||!Number.isFinite(y))return null;
      dot+=x*y; na+=x*x; nb+=y*y;
    }
    if(na<=0||nb<=0)return null;
    return dot/(Math.sqrt(na)*Math.sqrt(nb));
  }
  function temporalDiverseSamples(samples,minTemporalSeparation){
    if(!Array.isArray(samples)||!samples.length)return [];
    const gap=Math.max(0,Number(minTemporalSeparation)||0);
    if(gap<=0)return samples.slice();
    const timed=samples.filter(x=>Number.isFinite(Number(x&&x.time)));
    if(timed.length<2)return samples.slice();
    const untimed=samples.filter(x=>!Number.isFinite(Number(x&&x.time)));
    const ordered=timed.slice().sort((a,b)=>(b.quality-a.quality)||(a.time-b.time));
    const kept=[];
    for(const row of ordered){
      if(kept.every(x=>Math.abs(Number(row.time)-Number(x.time))>=gap))kept.push(row);
    }
    kept.sort((a,b)=>Number(a.time)-Number(b.time));
    return [...kept,...untimed];
  }
  function create(options={}){
    const minSamples=Math.max(2,Number(options.minSamples)||3);
    const minSimilarity=Math.min(.999,Math.max(.5,Number(options.minSimilarity)||.86));
    const minMargin=Math.max(.01,Number(options.minMargin)||.06);
    const maxSamples=Math.max(minSamples,Number(options.maxSamples)||24);
    const minTemporalSeparation=Math.max(0,Number(options.minTemporalSeparation??0.35)||0);
    const tracks=new Map();
    function add(trackId,embedding,meta={}){
      const id=String(trackId??'').trim();
      if(!id)throw new Error('trackId requis');
      if(!Array.isArray(embedding)||!embedding.length)throw new Error('embedding requis');
      const quality=Number(meta.quality);
      if(Number.isFinite(quality)&&quality<0.35)return false;
      const row={embedding:[...embedding],quality:Number.isFinite(quality)?Math.max(0,Math.min(1,quality)):1,team:meta.team??null,time:Number.isFinite(Number(meta.time))?Number(meta.time):null};
      const arr=tracks.get(id)||[]; arr.push(row); if(arr.length>maxSamples)arr.splice(0,arr.length-maxSamples); tracks.set(id,arr); return true;
    }
    function evidence(id){
      const raw=tracks.get(String(id))||[];
      const effective=temporalDiverseSamples(raw,minTemporalSeparation);
      return {raw,effective};
    }
    function scoreSamples(a,b){
      const vals=[];
      for(const x of a)for(const y of b){
        if(x.team&&y.team&&x.team!==y.team)continue;
        const s=cosine(x.embedding,y.embedding); if(s==null)continue;
        vals.push({s,w:Math.max(.05,x.quality*y.quality)});
      }
      if(!vals.length)return null;
      vals.sort((p,q)=>q.s-p.s);
      const keep=vals.slice(0,Math.min(8,vals.length));
      let sw=0,ss=0; for(const v of keep){sw+=v.w;ss+=v.s*v.w;}
      return sw?ss/sw:null;
    }
    function suggest(trackId,candidateIds){
      const srcEvidence=evidence(trackId),src=srcEvidence.effective;
      if(src.length<minSamples)return {status:'INDISPONIBLE',reason:'INSUFFICIENT_SOURCE_EVIDENCE',rawSamples:srcEvidence.raw.length,effectiveSamples:src.length};
      const scored=[];
      for(const c of candidateIds||[]){
        const id=String(c); if(id===String(trackId))continue;
        const dstEvidence=evidence(id),dst=dstEvidence.effective;
        if(dst.length<minSamples)continue;
        const s=scoreSamples(src,dst); if(s!=null)scored.push({trackId:id,similarity:s,samples:Math.min(src.length,dst.length),rawSamples:Math.min(srcEvidence.raw.length,dstEvidence.raw.length)});
      }
      scored.sort((a,b)=>b.similarity-a.similarity);
      if(!scored.length)return {status:'INDISPONIBLE',reason:'NO_VALID_CANDIDATE'};
      const best=scored[0],second=scored[1];
      if(best.similarity<minSimilarity)return {status:'INDISPONIBLE',reason:'LOW_SIMILARITY',best};
      if(second&&best.similarity-second.similarity<minMargin)return {status:'A_VERIFIER',reason:'AMBIGUOUS_REID',best,second};
      return {status:'A_VERIFIER',reason:'REID_SUGGESTION_ONLY',best,second:second||null,policy:'NEVER_AUTO_MERGE'};
    }
    function diagnostics(){return {tracks:[...tracks].map(([id,v])=>({trackId:id,rawSamples:v.length,effectiveSamples:temporalDiverseSamples(v,minTemporalSeparation).length})),minSamples,minSimilarity,minMargin,maxSamples,minTemporalSeparation,policy:'NEVER_AUTO_MERGE',evidencePolicy:'TEMPORALLY_DIVERSE_SAMPLES'};}
    return {add,suggest,diagnostics};
  }
  return {create,cosine,temporalDiverseSamples};
});
