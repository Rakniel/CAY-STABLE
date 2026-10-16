'use strict';
const assert=require('assert');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');
const Stats=require('../player_stats_v1.js');
assert.strictEqual(typeof Stats.metricProjectorInfo,'function');
const state=Presence.createState(),project=p=>({x:p.x,y:p.y});
const samples=[
 {confidence:.49,validated:true,eligible:false,reason:'insuffisante'},
 {confidence:.5,validated:true,eligible:true},
 {confidence:.95,validated:true,eligible:true},
 {confidence:null,validated:true,eligible:false,reason:'indisponible'},
 {confidence:.9,validated:false,eligible:false},
 {confidence:' ',validated:true,eligible:false,reason:'indisponible'},
 {confidence:'not-a-number',validated:true,eligible:false,reason:'indisponible'}
];
const projectors={};
for(let i=0;i<samples.length;i++){
 const s=samples[i],segment=i+1;
 Presence.observeFrame(state,[{trackId:segment,score:.95}],i,{segment});
 projectors[segment]={validated:s.validated,confidence:s.confidence,source:'RUN35_SYNTHETIC',project};
}
const invalid=Presence.observeFrame(state,[{trackId:1,score:.9},{trackId:1,score:.8}],samples.length,{segment:3});
assert.strictEqual(invalid.quality,'INDISPONIBLE');
const report=Report.buildPresenceReport(state,[],projectors);
assert.strictEqual(report.invalidObservedInstants,1);
assert.strictEqual(report.observedPlayerSlots,7);
assert.strictEqual(report.metricProjectionCoverage,.2857);
for(let i=0;i<samples.length;i++){
 const got=report.frames[i],s=samples[i];
 assert.strictEqual(got.metricProjectionValidated,s.eligible,'segment '+(i+1));
 if(s.reason)assert.ok(got.metricCalibrationReason.includes(s.reason),'reason '+(i+1));
}
assert.strictEqual(report.frames[7].metricProjectionValidated,false);
assert.strictEqual(report.frames[7].presentCount,0);
assert.ok(report.frames[7].metricCalibrationReason.includes('frame rejetée'));
assert.strictEqual(report.rosterSize,7);
const applied=Report.applyToReport({players:[],teamCoverage:{}},state,projectors);
assert.strictEqual(applied.teamCoverage.metricProjection,.2857);
const good=Presence.createState();
for(let i=0;i<100;i++)Presence.observeFrame(good,[{trackId:1,score:.9}],i,{segment:2});
const goodReport=Report.buildPresenceReport(good,[],{2:projectors[2]});
assert.strictEqual(goodReport.metricProjectionCoverage,1);
assert.strictEqual(goodReport.presenceCoverage,.0909);
console.log('observed_presence_metric_projection_confidence_nonregression: PASS');
