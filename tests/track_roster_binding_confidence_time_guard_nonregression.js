'use strict';
const assert=require('node:assert/strict');
const Binding=require('../track_roster_binding_v1.js');
const invalidConfidence=[null,undefined,'',' ',true,false,[],{},-0.01,1.01,'1.1','-0.1',Infinity,NaN];
const validConfidence=[0,0.8,1,'0','0.8','1'];
const invalidTime=[null,undefined,'',' ',true,false,[],{},NaN,Infinity];
const base={trackId:7,playerId:'p7',source:'MANUAL',confirmed:true};
for(let repetition=0;repetition<5;repetition++){
  for(const confidence of invalidConfidence){
    const row={...base,confidence};
    assert.throws(()=>Binding.normalizeBinding(row),/TRACK_BINDING_CONFIDENCE_REQUIRED/);
    assert.throws(()=>Binding.createState({bindings:[row]}),/TRACK_BINDING_CONFIDENCE_REQUIRED/);
    assert.throws(()=>Binding.bind(Binding.createState(),row),/TRACK_BINDING_CONFIDENCE_REQUIRED/);
  }
  for(const confidence of validConfidence){
    const row=Binding.normalizeBinding({...base,confidence});
    assert.strictEqual(row.confidence,Number(confidence));
    if(Number(confidence)>=Binding.MIN_RELIABLE_CONFIDENCE)
      assert.strictEqual(Binding.resolve(Binding.bind(Binding.createState(),{...base,confidence}),7).status,'FIABLE');
    else assert.throws(()=>Binding.bind(Binding.createState(),{...base,confidence}),/TRACK_BINDING_CONFIDENCE_INSUFFICIENT/);
  }
  const state=Binding.bind(Binding.createState(),{...base,confidence:1,atMs:0});
  const participation={byPlayerId:{p7:[{startMs:0,endMs:1000}]}};
  for(const atMs of invalidTime){
    assert.strictEqual(Binding.normalizeBinding({...base,confidence:1,atMs}).atMs,null);
    assert.strictEqual(Binding.resolveAtTime(state,7,participation,atMs).status,'INDISPONIBLE');
  }
  assert.strictEqual(Binding.resolveAtTime(state,7,participation,0).status,'FIABLE');
  assert.strictEqual(Binding.resolveAtTime(state,7,participation,'0').status,'FIABLE');
  assert.strictEqual(Binding.resolveAtTime(state,7,participation,1000).status,'INDISPONIBLE');
}
console.log('track roster confidence and time evidence: PASS');
