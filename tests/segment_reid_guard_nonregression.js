const assert=require('assert');
const Guard=require('../segment_reid_guard_v1.js');

function fakeBridge(){
  return {
    inferSegmentBreak(ctx){return {break:ctx.segmentBreak===true};},
    create(){
      const state={segment:1,archive:[],active:[]};
      let lastTime=null;
      return {
        state,
        processFrame(input,time,ctx){
          if(ctx.segmentBreak===true){
            for(const tr of state.active){tr.archived=true;state.archive.push(tr);} 
            state.active=[];state.segment++;
          }
          const out=[];
          for(const d of input||[]){
            let tr=null;
            if(ctx.reidentifyArchived!==false)tr=state.archive.find(x=>x.feature===d.feature)||null;
            if(tr){state.archive=state.archive.filter(x=>x!==tr);tr.segment=state.segment;tr.archived=false;}
            else tr={globalId:d.id,feature:d.feature,segment:state.segment,archived:false};
            state.active.push(tr);out.push({trackId:tr.globalId});
          }
          lastTime=time;return out;
        },
        snapshot(){return {lastTime};},
        report(){return {ok:true};}
      };
    }
  };
}

const Bridge=Guard.decorate(fakeBridge());
const b=Bridge.create({segmentCompatibilityKey:'wide-A'});
b.state.active.push({globalId:1,feature:'red',segment:1,archived:false});

let r=b.processFrame([{id:2,feature:'red'}],10,{segmentBreak:true,segmentCompatibilityKey:'close-B'});
assert.strictEqual(r[0].trackId,2,'incompatible first frame must not reconnect archived ID');
assert.strictEqual(b.segmentReidGuardDiagnostics().blockedFirstFrame,1);
assert.strictEqual(b.state.archive.some(t=>t.globalId===1),true,'old ID must remain available for manual review');

b.state.archive.push({globalId:3,feature:'blue',segment:1,archived:true});
r=b.processFrame([{id:4,feature:'blue'}],11,{segmentCompatibilityKey:'close-B'});
assert.strictEqual(r[0].trackId,4,'incompatible archived candidate must stay blocked inside segment');
assert.ok(b.segmentReidGuardDiagnostics().blockedCandidates>=1);
assert.strictEqual(b.state.archive.some(t=>t.globalId===3),true,'blocked candidate must be restored, not deleted');

b.processFrame([],20,{segmentBreak:true,segmentCompatibilityKey:'wide-A'});
r=b.processFrame([{id:9,feature:'red'}],21,{segmentCompatibilityKey:'wide-A'});
assert.strictEqual(r[0].trackId,1,'compatible segment key may reconnect old ID');

const diag=b.report().segmentReidGuard;
assert.strictEqual(diag.policy,'EXPLICIT_SEGMENT_COMPATIBILITY_ONLY');
assert.strictEqual(diag.unknownCompatibility,'ALLOW_STRONG_REID_WITH_EXISTING_THRESHOLDS');
assert.ok(diag.segmentKeys.some(x=>x.segment===1&&x.key==='wide-A'));
assert.ok(diag.segmentKeys.some(x=>x.segment===2&&x.key==='close-B'));
assert.ok(diag.segmentKeys.some(x=>x.segment===3&&x.key==='wide-A'));
assert.strictEqual(Guard.compatibilityKey({fieldGeometryId:'geom-1'}),'geom-1');
assert.strictEqual(Guard.compatibilityKey({}),null);
console.log('segment reid guard non-regression: PASS');
