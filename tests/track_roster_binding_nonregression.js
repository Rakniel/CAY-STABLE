const assert=require('assert');
const Binding=require('../track_roster_binding_v1.js');

let state=Binding.createState();
state=Binding.bind(state,{trackId:12,playerId:'p9',source:'MANUAL',confidence:.95,confirmed:true,atMs:0});
assert.strictEqual(Binding.resolve(state,12).status,'FIABLE');
assert.strictEqual(Binding.resolve(state,12).playerId,'p9');

assert.throws(()=>Binding.bind(state,{trackId:13,playerId:'p10',source:'REID_FUSED',confidence:.91,confirmed:true}),/TRACK_BINDING_EVIDENCE_REQUIRED/);
assert.throws(()=>Binding.bind(state,{trackId:13,playerId:'p10',source:'REID_FUSED',confidence:.79,confirmed:true,evidence:['appearance']}),/TRACK_BINDING_CONFIDENCE_INSUFFICIENT/);
assert.throws(()=>Binding.bind(state,{trackId:13,playerId:'p9',source:'MANUAL',confidence:.99,confirmed:true}),/TRACK_BINDING_PLAYER_ALREADY_BOUND/);
assert.throws(()=>Binding.bind(state,{trackId:13,playerId:'p10',source:'MANUAL',confidence:.99,confirmed:false}),/TRACK_BINDING_EXPLICIT_CONFIRMATION_REQUIRED/);

state=Binding.bind(state,{trackId:13,playerId:'p10',source:'REID_FUSED',confidence:.88,confirmed:true,evidence:['appearance-gallery','shirt-number-10']});
assert.deepStrictEqual(Binding.reliableBindings(state).map(x=>x.playerId).sort(),['p10','p9']);

const participation={byPlayerId:{p9:[{startMs:0,endMs:30000}],p10:[{startMs:30000,endMs:null}]}};
assert.strictEqual(Binding.resolveAtTime(state,12,participation,29500).status,'FIABLE');
assert.strictEqual(Binding.resolveAtTime(state,12,participation,30500).status,'INDISPONIBLE');
assert.strictEqual(Binding.resolveAtTime(state,13,participation,29500).status,'INDISPONIBLE');
assert.strictEqual(Binding.resolveAtTime(state,13,participation,30500).status,'FIABLE');
assert.strictEqual(Binding.resolveAtTime(state,13,participation,NaN).status,'INDISPONIBLE');

state=Binding.unbind(state,12);
assert.strictEqual(Binding.resolve(state,12).status,'INDISPONIBLE');
console.log('track_roster_binding_nonregression: ok');
