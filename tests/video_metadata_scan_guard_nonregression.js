'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');

// A video can emit loadedmetadata with Infinity/NaN duration or missing dimensions.
// Never start an unbounded synchronous scan loop from those values.
for(const file of ['index.html','CAY_ANALYZER_STABLE.html']){
  const html=fs.readFileSync(file,'utf8');
  const match=html.match(/function validVideoMetadata\(v\)\{[^\n]+\}/);
  assert.ok(match,file+': missing shared metadata guard');
  const sandbox={};
  vm.runInNewContext(match[0]+';this.check=validVideoMetadata;',sandbox,{timeout:1000});
  const check=sandbox.check;
  const valid={duration:5400,videoWidth:1920,videoHeight:1080};
  assert.equal(check(valid),true,file+': valid 90 minute match rejected');
  for(const patch of [
    {duration:Infinity},{duration:NaN},{duration:0},{duration:-1},
    {videoWidth:0},{videoWidth:NaN},{videoHeight:0},{videoHeight:Infinity}
  ]){
    assert.equal(check({...valid,...patch}),false,file+': corrupt video metadata accepted '+JSON.stringify(patch));
  }
  const loaded=html.slice(html.indexOf('video.onloadedmetadata=()=>{'),html.indexOf('video.onerror=()=>{'));
  assert.ok(loaded.includes('if(!validVideoMetadata(video))'),file+': loadedmetadata can enable scan on invalid video');
  assert.ok(loaded.indexOf('if(!validVideoMetadata(video))')<loaded.indexOf("$('scanBtn').disabled=false"),file+': scan enabled before metadata check');
  assert.ok(loaded.includes('currentFile===f&&expressAnalysisArmed'),file+': stale upload timer can scan another file');
  const scan=html.slice(html.indexOf("$('scanBtn').onclick=async()=>{"),html.indexOf('function renderReviews(){'));
  assert.ok(scan.includes('if(!validVideoMetadata(video))'),file+': scan missing independent metadata guard');
  assert.ok(scan.indexOf('if(!validVideoMetadata(video))')<scan.indexOf('for(let t=0;t<video.duration'),file+': unbounded loop can run before metadata check');
  assert.ok(scan.includes('!Number.isFinite(iv)||iv<=0||Math.ceil(video.duration/iv)>3600'),file+': scan interval/sample count not bounded');
  assert.ok(scan.indexOf('Math.ceil(video.duration/iv)>3600')<scan.indexOf('for(let t=0;t<video.duration'),file+': scan limit applied too late');
  console.log(file+': metadata and scan guards PASS');
}
console.log('Video metadata finite-scan non-regression: PASS');
