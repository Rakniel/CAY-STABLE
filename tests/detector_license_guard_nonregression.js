'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};
(async()=>{
  const calls=[];
  const sandbox={console,fetch:async(input)=>{calls.push(typeof input==='string'?input:input?.url);return {ok:true};}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','detector_license_guard_v1.js'),'utf8'),sandbox);
  const G=sandbox.CAYDetectorLicenseGuard;
  ok(G&&G.version==='1.0.0','API garde licence disponible');
  const banned='https://huggingface.co/lukasiktar11/football-player-detector/resolve/main/best.onnx?download=true';
  const verdict=G.inspect(banned);
  ok(verdict.allowed===false,'modele distant AGPL bloque');
  ok(verdict.license==='AGPL-3.0','licence du blocage auditable');
  let blocked=false;
  try{await sandbox.fetch(banned);}catch(err){blocked=err?.code==='CAY_LICENSE_BLOCKED'&&err?.license==='AGPL-3.0';}
  ok(blocked,'fetch incompatible refuse avant telechargement');
  ok(calls.length===0,'source incompatible jamais transmise au fetch natif');
  const safe='https://example.test/compatible-model.onnx';
  await sandbox.fetch(safe);
  ok(calls.length===1&&calls[0]===safe,'source non bloquee conserve le fetch normal');
  ok(G.inspect({url:safe}).allowed===true,'inspection Request-like compatible');
  console.log(`${checks}/${checks} detector license guard non-regression: PASS`);
})().catch(err=>{console.error(err);process.exit(1);});
