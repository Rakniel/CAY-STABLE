(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricHeatmapBins=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const DEFAULT_FIELD_LENGTH_M=105;
  const DEFAULT_FIELD_WIDTH_M=68;
  const DEFAULT_BINS_X=21;
  const DEFAULT_BINS_Y=14;

  function build(points,options){
    const cfg={fieldLengthM:DEFAULT_FIELD_LENGTH_M,fieldWidthM:DEFAULT_FIELD_WIDTH_M,binsX:DEFAULT_BINS_X,binsY:DEFAULT_BINS_Y,...(options||{})};
    const fieldLengthM=Number(cfg.fieldLengthM)>0?Number(cfg.fieldLengthM):DEFAULT_FIELD_LENGTH_M;
    const fieldWidthM=Number(cfg.fieldWidthM)>0?Number(cfg.fieldWidthM):DEFAULT_FIELD_WIDTH_M;
    const binsX=Math.max(1,Math.floor(Number(cfg.binsX)||DEFAULT_BINS_X));
    const binsY=Math.max(1,Math.floor(Number(cfg.binsY)||DEFAULT_BINS_Y));
    const grid=Array.from({length:binsY},()=>Array(binsX).fill(0));
    let validSamples=0,rejectedSamples=0;

    for(const p of Array.isArray(points)?points:[]){
      if(!p||![p.x,p.y].every(finite)||p.metricValid!==true||p.inField!==true){rejectedSamples++;continue;}
      const x=Number(p.x),y=Number(p.y);
      if(x<0||x>fieldLengthM||y<0||y>fieldWidthM){rejectedSamples++;continue;}
      const ix=Math.min(binsX-1,Math.floor(x/fieldLengthM*binsX));
      const iy=Math.min(binsY-1,Math.floor(y/fieldWidthM*binsY));
      grid[iy][ix]++;
      validSamples++;
    }

    const maxCount=grid.reduce((m,row)=>Math.max(m,...row),0);
    const normalized=grid.map(row=>row.map(v=>maxCount?+(v/maxCount).toFixed(4):0));
    const totalSamples=validSamples+rejectedSamples;
    return {
      grid,normalized,binsX,binsY,fieldLengthM,fieldWidthM,
      validSamples,rejectedSamples,totalSamples,
      coverage:totalSamples?+(validSamples/totalSamples).toFixed(4):0,
      publishable:validSamples>0,
      status:validSamples>0?'DISPONIBLE':'INDISPONIBLE',
      method:'FIELD_SCOPED_METRIC_BINNING',
      policy:'UNIQUEMENT_COORDONNEES_METRIQUES_VALIDEES_ET_DANS_TERRAIN_AUCUNE_INTERPOLATION'
    };
  }

  return {DEFAULT_FIELD_LENGTH_M,DEFAULT_FIELD_WIDTH_M,DEFAULT_BINS_X,DEFAULT_BINS_Y,build};
});
