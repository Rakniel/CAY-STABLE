'use strict';
const assert=require('assert');

function chooseFieldForNextReference({canvas,targetPos,anchor,stableConnectedPitchField}){
  // STABLE target behavior: geometry must be recalculated for every new image,
  // even when sceneIndex is unchanged. Previous field may only influence appearance/model learning,
  // never be copied as geometry.
  const chosen=stableConnectedPitchField(canvas,targetPos);
  if(!chosen?.poly?.length) throw new Error('terrain automatique non fiable sur ce cadrage');
  return {
    poly:chosen.poly.map(p=>({...p})),
    mode:chosen.mode||'RECALCULE_IMAGE',
    confidence:Number.isFinite(chosen.confidence)?chosen.confidence:0,
    fieldAnchorRef:anchor?.refIndex!=null?anchor.refIndex+1:null
  };
}

let calls=0;
const detector=(canvas)=>{calls++;return {poly:[{x:.1,y:.1},{x:.9,y:.1},{x:.8,y:.9},{x:.2,y:.9}],mode:'RECALCULE_IMAGE',confidence:.81};};
const anchor={sceneIndex:4,refIndex:0,poly:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]};
const a=chooseFieldForNextReference({canvas:{id:'frameA'},targetPos:1,anchor,stableConnectedPitchField:detector});
const b=chooseFieldForNextReference({canvas:{id:'frameB'},targetPos:2,anchor,stableConnectedPitchField:detector});
assert.equal(calls,2,'detector must run once per reference image');
assert.notDeepStrictEqual(a.poly,anchor.poly,'same-scene reference must not copy anchor geometry');
assert.notDeepStrictEqual(b.poly,anchor.poly,'third reference must also be recalculated');
assert.equal(a.mode,'RECALCULE_IMAGE');
assert.equal(a.fieldAnchorRef,1);
assert.throws(()=>chooseFieldForNextReference({canvas:{},targetPos:1,anchor,stableConnectedPitchField:()=>({poly:null})}),/terrain automatique non fiable/);
const detector2=()=>({poly:[{x:.12,y:.15},{x:.92,y:.12},{x:.75,y:.88}],mode:'CONNECTED_PITCH',confidence:.7});
const c=chooseFieldForNextReference({canvas:{},targetPos:1,anchor:null,stableConnectedPitchField:detector2});
assert.equal(c.poly.length,3);
assert.equal(c.fieldAnchorRef,null);
console.log('7/7 terrain recalculation non-regression: PASS');
