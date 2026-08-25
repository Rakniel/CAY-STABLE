const Bridge=require('../stable_tracking_bridge_v1.js');
let pass=0;
function ok(v,msg){if(!v)throw new Error('FAIL: '+msg);pass++;console.log('PASS',msg)}
function feat(i){return [i/20,(20-i)/20,.2,.8]}

const box=Bridge.normalizeDetection({b:{x:10,y:20,w:20,h:40},cat:'team',score:.8},100,100);
ok(Math.abs(box.x-.2)<1e-9 && Math.abs(box.y-.584)<1e-9,'legacy box converted to normalized foot anchor');

const b=Bridge.create();
const first=Array.from({length:14},(_,i)=>({x:.05+i*.075,y:.55,cat:i===0?'goalkeeper':'team',score:.95-i*.01,feature:feat(i)}));
const a=b.processFrame(first,0,{});
ok(a.length===11,'hard cap at 11 simultaneous CAY players');
ok(new Set(a.map(x=>x.trackId)).size===11,'no duplicate player ID in one frame');
ok(b.snapshot().rosterTotal===11,'initial roster contains 11 unique IDs');
const knownId=a[4].trackId;

const afterCut=b.processFrame([{x:.72,y:.40,cat:a[4].cat,score:.94,feature:feat(4)}],5,{segmentBreak:true});
ok(afterCut.length===1,'player accepted after camera cut');
ok(afterCut[0].trackId===knownId,'strong appearance match re-identifies same player across segments');
ok(b.snapshot().segments===2,'camera cut creates a new segment');

const newcomer=b.processFrame([{x:.15,y:.22,cat:'team',score:.93,feature:[.99,.01,.99,.01]}],6,{});
ok(newcomer.length===1,'new player accepted');
ok(newcomer[0].trackId!==knownId,'different appearance is not forced onto previous ID');
ok(b.snapshot().rosterTotal===12,'match roster may exceed 11 through replacements');

const report=b.report({});
ok(report.players.length===12,'individual player cards exported for full roster');
ok(report.players.every(p=>p.metric.distanceM===null),'metric distance remains unavailable without validated projector');
ok(report.unavailable.possession && report.unavailable.passes && report.unavailable.shots,'unvalidated ball events remain unavailable');
ok(report.bridge.frames===3,'bridge report preserves global processed-frame count');

console.log(`bridge nonregression: ${pass}/14 PASS`);