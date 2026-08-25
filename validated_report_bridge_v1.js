(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./player_stats_v1.js'),require('./replacement_events_v1.js'));
  }else{
    root.CAYValidatedReport=factory(root.CAYPlayerStats,root.CAYReplacementEvents);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(PlayerStats,ReplacementEvents){
  function ensureDeps(){
    if(!PlayerStats||typeof PlayerStats.buildReport!=='function')throw new Error('CAYPlayerStats.buildReport requis');
    if(!ReplacementEvents||typeof ReplacementEvents.buildValidatedReplacementLayer!=='function'||typeof ReplacementEvents.applyToPlayerCard!=='function')throw new Error('CAYReplacementEvents requis');
  }
  function buildReport(coreState,coreApi,projectors,replacementEvents){
    ensureDeps();
    const base=PlayerStats.buildReport(coreState,coreApi,projectors||{});
    const ids=(base.players||[]).map(p=>p.id);
    const layer=ReplacementEvents.buildValidatedReplacementLayer(replacementEvents||[],ids);
    const players=(base.players||[]).map(card=>ReplacementEvents.applyToPlayerCard(card,layer));
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
      unavailable
    };
  }
  return {buildReport};
});
