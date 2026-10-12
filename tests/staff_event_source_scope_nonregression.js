'use strict';
const assert=require('node:assert/strict');
const E=require('../staff_tactical_engine_v1.js');
const base={id:'ev1',action:'THROW_IN',videoSecond:40,team:'CAY',zone:'MIDDLE_THIRD',outcome:'LOST',evidenceState:'COACH_CONFIRMED',quality:'VIDEO_REVIEWED',coachName:'Coach',matchId:'match-A',sourceVideoId:'video-A'};
let checks=0;
function eq(actual,expected,label){assert.equal(actual,expected,label);checks++;}
for(let pass=0;pass<6;pass++){
 eq(E.summarizeObservations([base,{...base,matchId:'match-B',outcome:'RETAINED'}]).confirmed,2,'same event ID across matches');
 eq(E.summarizeObservations([base,{...base,sourceVideoId:'video-B'}]).confirmed,2,'same event ID across videos');
 eq(E.summarizeObservations([base,{...base,outcome:'RETAINED'}]).confirmed,0,'conflicting same-source revisions');
 eq(E.summarizeObservations([base,{...base,id:'ev2'}]).confirmed,1,'duplicate throw-in dedup');
 eq(E.summarizeObservations([base,{...base,id:'ev2',outcome:'RETAINED'}]).confirmed,0,'contradictory actions withheld');
 eq(E.summarizeObservations([base,{...base,matchId:'match-B'}],{matchId:'match-A'}).confirmed,1,'match scope');
 eq(E.summarizeObservations([base,{...base,id:'ev2',replayExcluded:true}]).confirmed,1,'replay excluded');
 eq(E.summarizeObservations([base,{...base,id:'ev2',evidenceState:'OBSERVED'}]).confirmed,1,'unconfirmed excluded');
}
console.log('PASS '+checks+' assertions / 6 repetitions');
