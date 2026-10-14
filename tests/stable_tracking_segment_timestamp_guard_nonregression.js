'use strict';
const assert=require('node:assert/strict');
const Bridge=require('../stable_tracking_bridge_v1.js');
const invalidSegments=[null,undefined,'',' ',false,true,NaN,Infinity,-1,1.2,'1.2','-1','0x1','01',{},[]];
const invalidKeys=['','abc','01','-1','1.5'];
const invalidTimes=[null,undefined,'',' ',false,true,-1,-0.001,NaN,Infinity,-Infinity,{},[]];
const project=p=>p;
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++;}
for(let repetition=0;repetition<5;repetition++){
  for(const segment of invalidSegments){
    const entry=Bridge.bindProjectorsToSegments({0:{validated:true,segment,project}})[0];
    check(entry.validated===false&&entry.project===null,'invalid segment must never project');
  }
  for(const key of invalidKeys){
    const entry=Bridge.bindProjectorsToSegments({[key]:{validated:true,segment:0,project}})[key];
    check(entry.validated===false&&entry.project===null,'invalid segment key must never project');
  }
  for(const [key,segment] of [['0',0],['1',1],['1','1'],['12',12]]){
    const entry=Bridge.bindProjectorsToSegments({[key]:{validated:true,segment,project}})[key];
    check(entry.validated===true&&entry.project===project,'explicit segment accepted');
  }
  const mismatch=Bridge.bindProjectorsToSegments({0:{validated:true,segment:1,project}})[0];
  check(mismatch.validated===false&&mismatch.project===null,'wrong camera segment rejected');
  const tracker=Bridge.create();
  for(const time of invalidTimes){
    const before=JSON.stringify(tracker.snapshot());
    let threw=false;
    try{tracker.processFrame([],time,{width:1920,height:1080});}
    catch(error){threw=/temps frame invalide/.test(error.message);}
    check(threw,'invalid time rejected');
    check(JSON.stringify(tracker.snapshot())===before,'invalid time has no side effect');
  }
  for(const time of [0,1.25,'1.25']){
    check(Bridge.create().processFrame([],time,{width:1920,height:1080}).length===0,'valid time accepted');
  }
}
console.log('PASS '+assertions+' strict segment/timestamp assertions');
