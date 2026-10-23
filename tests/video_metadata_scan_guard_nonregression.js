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
    {videoWidth:0},{videoWidth:NaN},{videoHeight:0},{videoHeight:Infinity},
    {error:{code:3}}
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

(async()=>{
 for(const file of ['index.html','CAY_ANALYZER_STABLE.html']){
  const html=fs.readFileSync(file,'utf8');
  const start=html.indexOf('function seek(t){'),end=html.indexOf('async function frame(t,maxW=420)');
  assert.ok(start>=0&&end>start,file+': seek source missing');
  const seekSource=html.slice(start,end);
  const events={};
  const video={duration:90,videoWidth:1920,videoHeight:1080,readyState:1,currentTime:0,
   addEventListener(n,fn){(events[n]??=[]).push(fn);},
   removeEventListener(n,fn){events[n]=(events[n]||[]).filter(x=>x!==fn);},
   emit(n){for(const fn of [...(events[n]||[])])fn();}
  };
  let timer=null,timeoutMs=0;
  const original={name:'first.mp4'};
  const ctx={video,currentFile:original,objUrl:'blob:first',
   validVideoMetadata:v=>Number.isFinite(v.duration)&&v.duration>0&&v.videoWidth>0&&v.videoHeight>0,
   setTimeout(fn,ms){timer=fn;timeoutMs=ms;return 1;},
   clearTimeout(){timer=null;}
  };
  vm.runInNewContext(seekSource+';this.seek=seek;',ctx,{timeout:1000});
  let pending=ctx.seek(12);
  assert.equal(video.currentTime,12,file+': seek target');
  video.emit('seeked');
  await pending;
  assert.equal((events.seeked||[]).length,0,file+': listeners cleaned on success');
  pending=ctx.seek(20);
  assert.equal(timeoutMs,8000,file+': timeout bound');
  timer();
  await assert.rejects(pending,/8 secondes/,file+': seek timeout must reject');
  assert.equal((events.seeked||[]).length,0,file+': listeners cleaned on timeout');
  pending=ctx.seek(25);
  ctx.currentFile={name:'second.mp4'};
  video.emit('seeked');
  await assert.rejects(pending,/remplacée/,file+': stale source must reject');
  ctx.currentFile=original;
  pending=ctx.seek(30);
  video.emit('emptied');
  await assert.rejects(pending,/remplacée/,file+': media emptied must abort seek');
  pending=ctx.seek(35);
  video.emit('error');
  await assert.rejects(pending,/Lecture impossible/,file+': media error must reject');
  video.readyState=2;video.currentTime=40;
  await ctx.seek(40);
  assert.equal((events.seeked||[]).length,0,file+': already-decoded frame must not attach listeners');
  ctx.currentFile=null;
  await assert.rejects(ctx.seek(42),/indisponible/,file+': missing video must reject');
  const scan=html.slice(html.indexOf("$('scanBtn').onclick=async()=>{"),html.indexOf('function renderReviews(){'));
  assert.ok(scan.includes('const scanFile=currentFile;'),file+': scan source not captured');
  assert.equal((scan.match(/if\(currentFile!==scanFile\)throw new Error/g)||[]).length,2,file+': source guard required after both frame awaits');
  assert.ok(scan.includes("finally{if(currentFile===scanFile)$('scanBtn').disabled=!validVideoMetadata(video)}"),file+': failed video decode must not re-enable scan');
  console.log(file+': seek timeout, cancellation, cleanup and scan source guards PASS');
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
