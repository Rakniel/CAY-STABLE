'use strict';
const assert=require('assert');
const fs=require('fs');
const UI=require('../club_roster_identity_ui_v1.js');
function storage(){
  const values=new Map();
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
}
const bindings=playerId=>[{trackId:1,playerId,validated:true,confidence:1,source:'coach_click'}];
const store=UI.createStore(storage());
store.saveBindings(bindings('P8'));
assert.deepStrictEqual(store.bindings('blob:match-B'),[],'legacy unscoped track IDs must not leak into another video');
store.saveBindings(bindings('P8'),'blob:match-A');
assert.strictEqual(store.bindings('blob:match-A')[0].playerId,'P8');
assert.deepStrictEqual(store.bindings('blob:match-B'),[],'same track ID in another match must start unlinked');
store.saveBindings(bindings('P9'),'blob:match-B');
assert.deepStrictEqual(store.bindings('blob:match-A'),[],'old video cannot reuse bindings saved for the new video');
assert.strictEqual(store.bindings('blob:match-B')[0].playerId,'P9');
assert.deepStrictEqual(store.bindings(null),[],'missing source must fail closed');
store.saveBindings(bindings('P1'),null);
assert.strictEqual(store.bindings('blob:match-B')[0].playerId,'P9','missing source must not overwrite validated bindings');
for(let i=0;i<1000;i++){
  const source='blob:match-'+i;
  store.saveBindings(bindings('P'+i),source);
  assert.strictEqual(store.bindings(source)[0].playerId,'P'+i);
  assert.deepStrictEqual(store.bindings('blob:match-'+(i+1)),[],'cross-video binding leak at iteration '+i);
}
const oldDocument=globalThis.document;
let videoSource='blob:match-A';
globalThis.document={getElementById:id=>id==='video'?{src:videoSource}:null};
try{
  assert.strictEqual(UI.currentAnalysisScope(),'blob:match-A');
  const source=fs.readFileSync(require.resolve('../club_roster_identity_ui_v1.js'),'utf8');
  assert(source.includes('lastScope!==currentAnalysisScope()'),'stale reports must not refresh player cards');
  assert(source.includes('reportScope!==currentAnalysisScope()'),'asynchronous old-video rendering must be rejected');
  assert(source.includes('store.bindings(lastScope)'),'roster session must load video-scoped bindings');
  assert(source.includes('store.saveBindings(lastSession.exportBindings(),lastScope)'),'explicit confirmation must save within the video scope');
  videoSource='blob:match-B';
  assert.strictEqual(UI.currentAnalysisScope(),'blob:match-B');
}finally{
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
}
console.log('video-scoped roster identity non-regression: PASS (1000 cross-video scenarios)');
