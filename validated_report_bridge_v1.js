(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./player_stats_v1.js'),require('./replacement_events_v1.js'));
  }else{
    root.CAYValidatedReport=factory(root.CAYPlayerStats,root.CAYReplacementEvents);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(PlayerStats,ReplacementEvents){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function ensureDeps(){
    if(!PlayerStats||typeof PlayerStats.buildReport!=='function')throw new Error('CAYPlayerStats.buildReport requis');
    if(!ReplacementEvents||typeof ReplacementEvents.buildValidatedReplacementLayer!=='function'||typeof ReplacementEvents.applyToPlayerCard!=='function')throw new Error('CAYReplacementEvents requis');
  }
  function segmentHeatmap(points,cols=6,rows=4){
    const cells=Array.from({length:rows},()=>Array(cols).fill(0));
    for(const p of points||[]){
      if(!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))continue;
      const x=clamp(Number(p.x),0,.999999),y=clamp(Number(p.y),0,.999999);
      cells[Math.floor(y*rows)][Math.floor(x*cols)]++;
    }
    const observations=cells.reduce((s,row)=>s+row.reduce((a,b)=>a+b,0),0);
    return {cols,rows,cells,max:cells.reduce((m,r)=>Math.max(m,...r),0),observations};
  }
  function buildSegmentVisuals(coreState){
    const byId=new Map();
    for(const tr of [...(coreState?.archive||[]),...(coreState?.active||[])]){
      const segments=new Map();
      for(const p of tr.fullPath||[]){
        const segment=Number(p.segment);
        if(!Number.isFinite(segment)||!Number.isFinite(Number(p.time)))continue;
        if(!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))continue;
        if(!segments.has(segment))segments.set(segment,[]);
        segments.get(segment).push({
          time:Number(p.time),segment,
          x:clamp(Number(p.x),0,1),y:clamp(Number(p.y),0,1)
        });
      }
      const views=[...segments.entries()].sort((a,b)=>a[0]-b[0]).map(([segment,points])=>{
        points.sort((a,b)=>a.time-b.time);
        const heatmap=segmentHeatmap(points);
        return {
          segment,
          firstTime:points.length?points[0].time:null,
          lastTime:points.length?points[points.length-1].time:null,
          observations:points.length,
          trajectoryNormalized:points,
          heatmap,
          quality:points.length>=10?'FIABLE':(points.length>=2?'PARTIEL':'INDISPONIBLE'),
          coordinateSpace:'IMAGE_NORMALISEE_SEGMENT',
          fusionRule:'NE_PAS_FUSIONNER_AVEC_UN_AUTRE_SEGMENT_SANS_GEOMETRIE_COMPATIBLE'
        };
      });
      byId.set(tr.globalId,views);
    }
    return byId;
  }
  function buildReport(coreState,coreApi,projectors,replacementEvents){
    ensureDeps();
    const base=PlayerStats.buildReport(coreState,coreApi,projectors||{});
    const ids=(base.players||[]).map(p=>p.id);
    const layer=ReplacementEvents.buildValidatedReplacementLayer(replacementEvents||[],ids);
    const visualById=buildSegmentVisuals(coreState);
    const players=(base.players||[]).map(card=>{
      const withReplacement=ReplacementEvents.applyToPlayerCard(card,layer);
      const segmentVisuals=visualById.get(card.id)||[];
      return {
        ...withReplacement,
        segmentVisuals,
        visualTrajectoryQuality:segmentVisuals.length?(
          segmentVisuals.every(v=>v.quality==='FIABLE')?'FIABLE':'PARTIEL'
        ):'INDISPONIBLE',
        visualCoordinatesPolicy:'coordonnées image et heatmaps conservées par segment; aucune fusion inter-plans implicite'
      };
    });
    const unavailable={...(base.unavailable||{})};
    if(layer.confirmedCount>0)delete unavailable.confirmedReplacements;
    else unavailable.confirmedReplacements=layer.rejectedCount
      ?`aucun événement de remplacement validé (${layer.rejectedCount} rejeté${layer.rejectedCount>1?'s':''})`
      :'aucun événement de remplacement validé';
    return {
      ...base,
      players,
      team:{
        ...(base.team||{}),
        confirmedReplacements:layer.confirmedCount,
        replacementQuality:layer.quality,
        replacementRejectedCount:layer.rejectedCount
      },
      validatedReplacements:layer,
      visualProvenance:{
        coordinateSpace:'IMAGE_NORMALISEE_PAR_SEGMENT',
        segmentSeparated:true,
        crossSegmentFusion:false,
        reason:'les cadrages caméra peuvent être incompatibles après cut, zoom ou pan'
      },
      unavailable
    };
  }
  return {buildReport,buildSegmentVisuals,segmentHeatmap};
});
