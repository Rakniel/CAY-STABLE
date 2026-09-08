const assert=require('assert');

require('../stable_runtime_tracking_v2.js');
const api=global.CAYStableUnavailableFrameRuntime;
assert.ok(api&&typeof api.mark==='function','le runtime doit exposer le chemin canonique des frames indisponibles');

const ids=['tFrames','tIds','tStable','tLongest','tMatches','tSegments','trackingBar','trackingStatus'];
const elements=Object.fromEntries(ids.map(id=>[id,{textContent:'',style:{}}]));
global.document={getElementById:id=>elements[id]||null};
global.tf=t=>'T'+Number(t).toFixed(1);
let statusMessage=null;
global.status=(_el,message)=>{statusMessage=message;};

(async()=>{
  const calls=[];
  const bridge={
    state:{segment:3},
    processUnavailableFrame(time,context){calls.push({time,context});},
    summary(){return {tracks:[{observations:7},{observations:2}],rosterTotal:4,totalAssociations:12,segments:3};}
  };
  const frames=[];
  await api.mark(bridge,frames,2.5,{width:1280,height:720},4,10,'DETECTOR_INFERENCE_FAILED','détection indisponible, frame exclue des stats');

  assert.strictEqual(calls.length,1,'une panne détecteur doit devenir exactement une frame indisponible');
  assert.strictEqual(calls[0].time,2.5);
  assert.deepStrictEqual(calls[0].context,{width:1280,height:720,maxPlayers:11,reason:'DETECTOR_INFERENCE_FAILED'});
  assert.deepStrictEqual(frames,[{time:2.5,label:'T2.5',segment:3,status:'INDISPONIBLE',reason:'DETECTOR_INFERENCE_FAILED',detections:[]}], 'aucun joueur ne doit être inventé lors d’une panne détecteur');
  assert.strictEqual(elements.tFrames.textContent,5);
  assert.strictEqual(elements.tIds.textContent,4);
  assert.strictEqual(elements.tStable.textContent,1);
  assert.strictEqual(elements.tLongest.textContent,'7 img');
  assert.strictEqual(elements.tMatches.textContent,12);
  assert.strictEqual(elements.tSegments.textContent,3);
  assert.strictEqual(elements.trackingBar.style.width,'50%');
  assert.ok(statusMessage.includes('détection indisponible'));

  await assert.rejects(
    ()=>api.mark({state:{segment:1}},[],1,{width:10,height:10},0,1,'DETECTOR_INFERENCE_FAILED','x'),
    /garde couverture frames indisponibles absent/,
    'sans garde strict, le runtime doit échouer fermé plutôt que masquer la panne'
  );

  const source=require('fs').readFileSync(require('path').join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');
  assert.ok(/try\{raw=await detectTracking\(model,c\);\}\s*catch\(_\)\{[\s\S]*DETECTOR_INFERENCE_FAILED[\s\S]*continue;\s*\}/.test(source),'la panne d’inférence doit être capturée au niveau frame et l’analyse doit continuer');

  console.log('stable detector frame failure non-regression: PASS (15 checks)');
})().catch(err=>{console.error(err);process.exitCode=1;});
