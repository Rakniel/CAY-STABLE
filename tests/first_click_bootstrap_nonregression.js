'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

// CDN model downloads must not block inline application event handlers.
// The loading splash must dismiss even when an optional CDN request stalls.
for(const filename of ['index.html','CAY_ANALYZER_STABLE.html']){
 const html=fs.readFileSync(filename,'utf8');
 const sources=[
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.webgpu.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'
 ];
 for(const src of sources){
  assert(html.includes('<script defer src="'+src+'"></script>'),filename+' blocks initialization on model CDN: '+src);
  assert(!html.includes('<script src="'+src+'"></script>'),filename+' still has blocking model CDN');
 }
 assert(html.includes('#splash.hide{opacity:0;visibility:hidden;pointer-events:none}'),filename+' hidden splash may intercept clicks');
 const line=html.split('\n').find(x=>x.includes('const hideSplash='));
 assert(line,filename+' missing independent splash dismissal');
 assert(!line.includes("addEventListener('load'"),filename+' splash waits for all remote resources');
 let dismissed=0,callback=null,domReady=null;
 const ctx={
  document:{getElementById:id=>id==='splash'?{classList:{add:x=>{if(x==='hide')dismissed++;}}}:null},
  window:{addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')domReady=fn;}},
  setTimeout:fn=>{callback=fn;}
 };
 vm.runInNewContext(line,ctx,{timeout:1000});
 assert.strictEqual(typeof callback,'function',filename+' lacks timeout fallback');
 assert.strictEqual(typeof domReady,'function',filename+' lacks DOM ready fallback');
 callback();
 domReady();
 assert.strictEqual(dismissed,2,filename+' splash did not dismiss independently of window load');
 console.log(filename+' first-click bootstrap: PASS');
}
