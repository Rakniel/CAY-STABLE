'use strict';
const assert=require('assert');
const Runtime=require('../rfdetr_onnx_runtime_v1.js');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

(async()=>{
  const white=new Uint8ClampedArray([255,255,255,255]);
  const p=Runtime.preprocessPixels(white,1,1,1,1,3);
  ok(Math.abs(p[0]-((1-.485)/.229))<1e-5,'red channel uses ImageNet normalization');
  ok(Math.abs(p[1]-((1-.456)/.224))<1e-5,'green channel uses ImageNet normalization');
  ok(Math.abs(p[2]-((1-.406)/.225))<1e-5,'blue channel uses ImageNet normalization');

  const quad=new Uint8ClampedArray([
    0,0,0,255, 255,255,255,255,
    255,255,255,255, 0,0,0,255
  ]);
  const q=Runtime.preprocessPixels(quad,2,2,1,1,3);
  const avg=.5;
  ok(Math.abs(q[0]-((avg-.485)/.229))<1e-5,'half-pixel resize averages symmetric 2x2 center without antialias kernel');

  class FakeTensor{constructor(type,data,dims){this.type=type;this.data=data;this.dims=dims;}}
  const boxes={dims:[1,2,4],data:new Float32Array([.5,.5,.2,.4,.2,.3,.1,.2])};
  const logits={dims:[1,2,4],data:new Float32Array([-5,4,2,-5,-5,1,4,-5])};
  const session={
    inputNames:['images'],inputMetadata:[{name:'images',shape:[1,3,2,2]}],
    outputNames:['dets','labels'],outputMetadata:[{name:'dets',shape:[1,2,4]},{name:'labels',shape:[1,2,4]}],
    async run(feeds){
      ok(feeds.images instanceof FakeTensor,'runtime feeds ONNX tensor under session input name');
      ok(feeds.images.dims.join(',')==='1,3,2,2','runtime honors model NCHW input shape');
      return {dets:boxes,labels:logits};
    }
  };
  ok(Runtime.looksLikeRFDETR(session)===true,'canonical RF-DETR outputs are recognized');
  ok(Runtime.inputShape(session).width===2,'input shape is read from ONNX Runtime metadata');

  const frameW=20,frameH=20,pixels=new Uint8ClampedArray(frameW*frameH*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=128;pixels[i+1]=128;pixels[i+2]=128;pixels[i+3]=255;}
  const canvas={width:frameW,height:frameH,getContext(){return {getImageData(){return {data:pixels};}};}};
  const bench=Runtime.createDetector(session,{candidateId:'rfdetr-soccernet-julianzu9612',profile:{personClassIds:[1,2]},Tensor:FakeTensor,mode:'benchmark'});
  ok(bench.kind==='football-rfdetr-benchmark','unvalidated local model is benchmark-only');
  const detections=await bench.detect(canvas,10,.8);
  ok(detections.length===2,'benchmark runtime decodes configured football people classes');

  assert.throws(()=>Runtime.createDetector(session,{candidateId:'rfdetr-soccernet-julianzu9612',profile:{personClassIds:[1,2]},Tensor:FakeTensor,mode:'runtime'}),/promotion blocked/i);checks++;
  const pass={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:true}};
  const provenance={source:'local-audited.onnx',license:'Apache-2.0',weightId:'sha256:test'};
  const stable=Runtime.createDetector(session,{candidateId:'rfdetr-soccernet-julianzu9612',profile:{personClassIds:[1,2]},Tensor:FakeTensor,mode:'runtime',benchmarkReport:pass,provenance});
  ok(stable.kind==='football-rfdetr','runtime mode unlocks only after promotion contract passes');

  assert.throws(()=>Runtime.createDetector(session,{candidateId:'rfdetr-core-apache',profile:{},Tensor:FakeTensor}),/PERSON_CLASS_PROFILE_REQUIRED/);checks++;
  console.log(`${checks}/${checks} RF-DETR ONNX runtime non-regression: PASS`);
})().catch(err=>{console.error(err);process.exit(1);});
