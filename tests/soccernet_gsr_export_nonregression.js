const assert=require('assert');
const {exportGSR}=require('../soccernet_gsr_export_v1.js');

const valid=exportGSR([
  {frame:10,time:0.4,segment:1,players:[
    {id:7,playerId:'cay-7',role:'player',teamSide:'left',jerseyNumber:7,pitchX:42.125,pitchY:31.5,metricValidated:true,identityQuality:'FIABLE',isCAY:true},
    {id:8,playerId:'cay-8',role:'player',teamSide:'left',jerseyNumber:null,pitchX:44,pitchY:30,projectionValidated:true,identityQuality:'FIABLE',isCAY:true},
    {id:'ref-1',role:'referee',teamSide:'right',jerseyNumber:99,pitchX:50,pitchY:34,metricValidated:true,identityQuality:'PARTIEL'}
  ]}
]);
assert.equal(valid.status,'OBSERVABLE');
assert.equal(valid.rows.length,3);
assert.equal(valid.rows[1].jersey_number,null);
assert.equal(valid.rows[2].team_side,null);
assert.equal(valid.rows[2].jersey_number,null);
assert.equal(valid.frameCoverage,1);

const strict=exportGSR([
  {frame:20,time:0.8,players:[
    {id:1,role:'player',teamSide:'left',pitchX:10,pitchY:20,metricValidated:false,identityQuality:'FIABLE',isCAY:true},
    {id:2,role:'player',teamSide:'left',pitchX:12,pitchY:20,metricValidated:true,identityQuality:'PARTIEL',isCAY:true},
    {id:3,role:'player',teamSide:'left',metricValidated:true,identityQuality:'FIABLE',isCAY:true}
  ]}
]);
assert.equal(strict.status,'INDISPONIBLE');
assert.equal(strict.rows.length,0);
assert.equal(strict.rejectedReasons.METRIC_PROJECTION_NOT_VALIDATED,1);
assert.equal(strict.rejectedReasons.IDENTITY_NOT_RELIABLE,1);
assert.equal(strict.rejectedReasons.PITCH_COORDINATES_MISSING,1);

const overflowPlayers=Array.from({length:12},(_,i)=>({id:i+1,role:'player',teamSide:'left',pitchX:i,pitchY:20,metricValidated:true,identityQuality:'FIABLE',isCAY:true}));
const overflow=exportGSR([{frame:30,time:1.2,players:overflowPlayers}]);
assert.equal(overflow.rows.length,0);
assert.equal(overflow.rejectedFrames,1);
assert.equal(overflow.rejectedReasons.MORE_THAN_11_CAY_ON_FIELD,1);

console.log('soccernet_gsr_export_nonregression: PASS');