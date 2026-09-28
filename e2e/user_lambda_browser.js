'use strict';
const fs=require('fs');
const path=require('path');
const {spawn,spawnSync}=require('child_process');
function findCmd(names){for(const n of names){const r=spawnSync('bash',['-lc','command -v '+n],{encoding:'utf8'});if(r.status===0&&r.stdout.trim())return r.stdout.trim()}return null}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function assert(cond,msg){if(!cond)throw new Error(msg)}
async function main(){
 const chrome=findCmd(['google-chrome-stable','google-chrome','chromium-browser','chromium']);assert(chrome,'Chromium/Chrome absent du runner');
 const ffmpeg=findCmd(['ffmpeg']);assert(ffmpeg,'ffmpeg absent du runner');
 const root=path.resolve(__dirname,'..');const video=path.join(root,'e2e-user-video.mp4');
 const gen=spawnSync(ffmpeg,['-y','-f','lavfi','-i','color=c=green:s=640x360:d=4','-f','lavfi','-i','color=c=blue:s=640x360:d=4','-f','lavfi','-i','color=c=green:s=640x360:d=4','-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0,format=yuv420p[v]','-map','[v]','-r','25','-c:v','libx264','-movflags','+faststart',video],{encoding:'utf8'});assert(gen.status===0,'échec génération vidéo: '+gen.stderr);
 const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--remote-debugging-pipe','about:blank'],{stdio:['ignore','pipe','pipe','pipe','pipe']});
 let nextId=1,buf='',pending=new Map();const read=child.stdio[4];read.setEncoding('utf8');
 read.on('data',chunk=>{buf+=chunk;let i;while((i=buf.indexOf('\0'))>=0){const raw=buf.slice(0,i);buf=buf.slice(i+1);if(!raw)continue;let msg;try{msg=JSON.parse(raw)}catch{continue}if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result||{})}}});
 function send(method,params,sessionId){params=params||{};const id=nextId++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});const m={id,method,params};if(sessionId)m.sessionId=sessionId;child.stdio[3].write(JSON.stringify(m)+'\0');setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('CDP timeout '+method))}},15000)})}
 try{
  const target=await send('Target.createTarget',{url:'file://'+path.join(root,'index.html')});
  const att=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});const session=att.sessionId;
  await send('Page.enable',{},session);await send('DOM.enable',{},session);await send('Runtime.enable',{},session);await sleep(2500);
  const title=(await send('Runtime.evaluate',{expression:'document.title',returnByValue:true},session)).result.value;assert(/CAY/i.test(title),'titre inattendu: '+title);
  const doc=await send('DOM.getDocument',{depth:2,pierce:true},session);const q=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#fileInput'},session);assert(q.nodeId,'input vidéo introuvable');
  await send('DOM.setFileInputFiles',{nodeId:q.nodeId,files:[video]},session);await send('Runtime.evaluate',{expression:"document.getElementById('fileInput').dispatchEvent(new Event('change',{bubbles:true}))"},session);
  let snap=null;const start=Date.now();
  while(Date.now()-start<45000){await sleep(1000);const expr="JSON.stringify({scan:document.getElementById('scanStatus')?.textContent||'',guidedHidden:document.getElementById('guidedCalibSection')?.classList.contains('hidden'),validationHidden:document.getElementById('validation55Section')?.classList.contains('hidden'),resultsHidden:document.getElementById('results')?.classList.contains('hidden'),trackingDisplay:getComputedStyle(document.getElementById('trackingSection')).display,refs:document.getElementById('v55Refs')?.textContent||'',scanDisabled:document.getElementById('scanBtn')?.disabled})";const ev=await send('Runtime.evaluate',{expression:expr,returnByValue:true},session);snap=JSON.parse(ev.result.value);if(/type\(s\) de plan détecté|Première utilisation|Profil CAY/i.test(snap.scan))break}
  assert(snap,'aucun état utilisateur observé');console.log('USER_LAMBDA_E2E_RESULT='+JSON.stringify({title,snap,elapsedMs:Date.now()-start}));
  assert(/type\(s\) de plan détecté|Première utilisation|Profil CAY|Analyse/i.test(snap.scan),'le chargement vidéo n a pas abouti automatiquement au scan/analyse: '+snap.scan);
  assert(snap.trackingDisplay!=='none','trackingSection est encore masquée dans le rendu navigateur');
  if(snap.resultsHidden){console.log('USER_LAMBDA_FINDING=FRESH_PROFILE_NO_DIRECT_RESULTS');process.exitCode=2}else console.log('USER_LAMBDA_FINDING=DIRECT_RESULTS_VISIBLE');
 }finally{try{child.kill('SIGKILL')}catch{}try{fs.unlinkSync(video)}catch{}}
}
main().catch(e=>{console.error('USER_LAMBDA_E2E_ERROR='+e.stack);process.exit(1)});