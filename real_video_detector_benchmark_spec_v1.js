(function(root){
'use strict';

const spec={
  version:'CAY_REAL_VIDEO_BENCHMARK_V1',
  video:{
    label:'Sarcelles vs Aubervilliers U16 R1',
    fileName:'Sarcelles vs Aubervilliers U16 R1.mp4',
    sizeBytes:377831884,
    durationSeconds:6894.074195,
    width:640,
    height:360,
    fpsNumerator:30000,
    fpsDenominator:1001,
    sha256:'dc94503f3f814a8e4e742d8e589323386a78aa762787de7e474e330f82b0ac84'
  },
  minCoverage:.82,
  frames:[
    {id:'t0120',time:120,minOnPitch:8,critical:false,tags:['far_players','spread']},
    {id:'t0600',time:600,minOnPitch:8,critical:false,tags:['low_density','far_goalkeeper']},
    {id:'t1200',time:1200,minOnPitch:12,critical:false,tags:['far_players','complex_background']},
    {id:'t1800',time:1800,minOnPitch:12,critical:true,tags:['camera_pan','spread']},
    {id:'t2400',time:2400,minOnPitch:13,critical:true,tags:['dense_box','occlusion']},
    {id:'t3000',time:3000,maxOnPitch:0,critical:true,tags:['empty_pitch','false_positive_guard']},
    {id:'t3600',time:3600,minOnPitch:4,critical:false,tags:['restart','very_low_density']},
    {id:'t4200',time:4200,minOnPitch:12,critical:false,tags:['far_players','dense_box']},
    {id:'t4800',time:4800,minOnPitch:10,critical:false,tags:['central_alignment','occlusion']},
    {id:'t5400',time:5400,minOnPitch:9,critical:true,tags:['bench_visible','staff_exclusion']},
    {id:'t6200',time:6200,minOnPitch:13,critical:false,tags:['mixed_scale','near_far_players']}
  ]
};

function clone(){return JSON.parse(JSON.stringify(spec));}
root.CAYRealVideoDetectorBenchmarkSpecV1={spec,clone};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYRealVideoDetectorBenchmarkSpecV1;
})(typeof globalThis!=='undefined'?globalThis:this);
