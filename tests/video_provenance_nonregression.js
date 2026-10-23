'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');

for(const file of ['index.html','CAY_ANALYZER_STABLE.html']){
  const html=fs.readFileSync(file,'utf8');
  const begin=html.indexOf('function setFile(f){');
  const end=html.indexOf('input.onchange=',begin);
  assert.ok(begin>=0&&end>begin,file+': setFile not found');
  const source=html.slice(begin,end);
  const elements={};
  const get=id=>elements[id]??=(id==='trackingGallery'
    ?{innerHTML:'OLD FRAMES',replaceChildren(){this.innerHTML='';}}
    :{classList:{added:[],add(name){this.added.push(name);},remove(){}},style:{display:'block'},disabled:false,textContent:''});
  const video={src:'',load(){},duration:90,videoWidth:1920,videoHeight:1080,error:null};
  const oldFile={name:'old.mp4',size:100};
  const ctx={
    $:get,video,currentFile:oldFile,objUrl:'blob:old',
    expressAnalysisArmed:true,expressAnalysisRunning:false,
    scenes:[{start:0,end:10}],currentScene:0,
    guidedCalibrationRefs:[{time:1}],guidedCalibrationPos:0,
    manualClassOverrides:{x:'team'},
    lastTrackingReport:{video:'old.mp4'},lastValidation55:{video:'old.mp4'},lastDiagnostic:{video:'old.mp4'},
    URL:{revokeObjectURL(){},createObjectURL(){return 'blob:new';}},
    status(el,msg){el.textContent=msg;},sf(){return '1 Mo';},
    validVideoMetadata(v){return Number.isFinite(v.duration)&&v.duration>0&&v.videoWidth>0&&v.videoHeight>0&&!v.error;},
    tf(){return '1:30';},refsFor(){return [];},
    restoreCalibrationSession(){return false;},restoreGlobalCAYProfile(){return false;},
    setTimeout(){},console
  };
  vm.runInNewContext(source+';this.setFile=setFile;',ctx,{timeout:1000});
  const newFile={name:'new.mp4',size:200};
  ctx.setFile(newFile);
  assert.equal(ctx.currentFile,newFile,file+': new source not installed');
  assert.equal(ctx.lastTrackingReport,null,file+': previous tracking report remains');
  assert.equal(ctx.lastValidation55,null,file+': previous validation report remains');
  assert.equal(ctx.lastDiagnostic,null,file+': previous diagnostic remains');
  assert.equal(ctx.scenes.length,0,file+': old camera plans remain');
  assert.equal(ctx.guidedCalibrationRefs.length,0,file+': old video calibration remains');
  assert.equal(get('trackingGallery').innerHTML,'',file+': previous tracking frames remain');
  assert.equal(get('exportTracking').disabled,true,file+': previous tracking export remains enabled');
  assert.equal(get('exportTrainingPack56').disabled,true,file+': previous analysis export remains enabled');
  for(const id of ['results','validation55Section','metaStats'])
    assert.ok(get(id).classList.added.includes('hidden'),file+': stale '+id+' remains visible');
  video.onloadedmetadata();
  assert.equal(get('scanBtn').disabled,false,file+': valid video cannot scan');
  assert.equal(get('runTracking').disabled,false,file+': valid video cannot track');
  video.onerror();
  assert.equal(ctx.currentFile,null,file+': decode failure still has a source');
  assert.equal(get('scanBtn').disabled,true,file+': decode failure can scan');

  const tracking=html.slice(html.indexOf('async function runTrackingTest(){'),html.indexOf('function validation55Text('));
  assert.ok(tracking.includes('const trackingFile=currentFile;'),file+': tracking lacks source snapshot');
  assert.ok((tracking.match(/currentFile!==trackingFile/g)||[]).length>=4,file+': tracking async stages lack source checks');
  assert.ok(tracking.includes("video:trackingFile.name"),file+': tracking can mislabel a report');
  assert.ok(tracking.includes("if(currentFile===trackingFile)$('runTracking').disabled=false"),file+': stale tracking changes new UI');
  const analysis=html.slice(html.indexOf('async function runFullValidation55(){'),html.indexOf('async function captureLearningFrame56('));
  assert.ok(analysis.includes('const analysisFile=currentFile;'),file+': analysis lacks source snapshot');
  assert.ok((analysis.match(/if\(abortIfSourceChanged\(\)\)return null;/g)||[]).length===3,file+': analysis phases missing guards');
  assert.ok(analysis.includes('video:analysisFile.name'),file+': analysis can mislabel a report');
  console.log(file+': source switch, stale reports and async guards PASS');
}
console.log('Video provenance non-regression: PASS');
