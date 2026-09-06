const assert=require('assert');
const heat=require('../metric_heatmap_bins_v1.js');

(function validBinningAndCoverage(){
  const result=heat.build([
    {x:0,y:0,metricValid:true,inField:true},
    {x:4.9,y:4,metricValid:true,inField:true},
    {x:104.9,y:67.9,metricValid:true,inField:true},
    {x:106,y:20,metricValid:true,inField:true},
    {x:10,y:10,metricValid:false,inField:true},
    {x:10,y:10,metricValid:true,inField:false}
  ]);
  assert.equal(result.validSamples,3);
  assert.equal(result.rejectedSamples,3);
  assert.equal(result.coverage,0.5);
  assert.equal(result.status,'DISPONIBLE');
  assert.equal(result.grid[0][0],2);
  assert.equal(result.grid[13][20],1);
  assert.equal(result.normalized[0][0],1);
  assert.equal(result.normalized[13][20],0.5);
})();

(function unavailableWithoutDefensibleMetricPoint(){
  const result=heat.build([
    {x:20,y:20,metricValid:false,inField:true},
    {x:20,y:20,metricValid:true,inField:false}
  ]);
  assert.equal(result.publishable,false);
  assert.equal(result.status,'INDISPONIBLE');
  assert.equal(result.coverage,0);
})();

(function exactPitchEdgesStayInLastBin(){
  const result=heat.build([{x:105,y:68,metricValid:true,inField:true}]);
  assert.equal(result.grid[13][20],1);
})();

console.log('metric_heatmap_bins_v1: PASS');
