const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

const tracker=Bridge.create({
  maxPlayers:11,
  lostAfter:8,
  reidentifyArchived:true,
  reidAppearanceThreshold:.10,
  reidScoreThreshold:.78,
  reidScoreUniquenessMargin:.035,
  maxReidGap:180
});

const players=Array.from({length:11},(_,i)=>({
  slot:i,
  cat:i===0?'goalkeeper':'team',
  feature:[.05+i*.11,.20+i*.013,.40+i*.007]
}));

function truthAt(i,frame,segment){
  const t=frame*.20;
  const baseX=.08+i*.074;
  const baseY=.28+(i%4)*.105;
  // Petite trajectoire déterministe, volontairement différente par joueur.
  const dx=.0009*frame*(1+(i%3)*.15);
  const dy=Math.sin((frame+i*2)*.18)*.006;
  const sceneShift=segment===2?.012:0;
  return {x:baseX+dx+sceneShift,y:baseY+dy,t};
}

function detectionFor(player,frame,segment){
  const p=truthAt(player.slot,frame,segment);
  return {
    cat:player.cat,
    x:p.x,
    y:p.y,
    score:.94-(player.slot%3)*.01,
    feature:[...player.feature],
    onField:true,
    insidePlayableArea:true,
    teamEvidenceValid:true,
    cayEligible:true
  };
}

function clutter(frame){
  return [
    {cat:'team',x:.96,y:.12,score:.99,feature:[9,9,9],isSpectator:true,sourceZone:'stands'},
    {cat:'team',x:.91,y:.84,score:.98,feature:[8,8,8],isBench:true,sourceZone:'bench'},
    {cat:'team',x:.88,y:.18,score:.97,feature:[7,7,7],yellowDetailOnly:true},
    {cat:'team',x:1.03,y:.50,score:.96,feature:[6,6,6],onField:true},
    {cat:'team',x:.50,y:-.02,score:.96,feature:[5,5,5],onField:true}
  ].map((d,j)=>({...d,syntheticClutterId:`${frame}:${j}`}));
}

const idsBySlot=new Map();
let maxVisible=0;
let frames=0;
let idSwitches=0;
let falsePublished=0;

function runSegment(segment,startFrame,endFrame,cutOnFirst=false){
  for(let frame=startFrame;frame<=endFrame;frame++){
    const detections=players.map(p=>detectionFor(p,frame,segment));
    const assigned=tracker.processFrame([...detections,...clutter(frame)],frame*.20,{
      width:1920,
      height:1080,
      segmentBreak:cutOnFirst&&frame===startFrame,
      segmentReason:cutOnFirst&&frame===startFrame?'synthetic_multi_plan_cut':undefined,
      maxPlayers:11
    });
    frames++;
    maxVisible=Math.max(maxVisible,assigned.length);
    assert.strictEqual(assigned.length,11,`frame ${frame}: exactement 11 CAY doivent être publiés`);
    for(let i=0;i<players.length;i++){
      const expected=detections[i];
      const match=assigned.find(a=>Math.hypot(a.x-expected.x,a.y-expected.y)<1e-8);
      assert(match,`frame ${frame}: vérité terrain joueur ${i} absente`);
      if(!idsBySlot.has(i))idsBySlot.set(i,match.trackId);
      else if(idsBySlot.get(i)!==match.trackId)idSwitches++;
    }
    for(const a of assigned){
      if(a.syntheticClutterId)falsePublished++;
    }
  }
}

runSegment(1,0,24,false);
runSegment(2,25,49,true);

const snap=tracker.snapshot();
const report=tracker.report({});

assert.strictEqual(idsBySlot.size,11,'11 identités de vérité terrain suivies');
assert.strictEqual(idSwitches,0,'aucun changement d’identité sur 50 frames et 2 plans');
assert.strictEqual(falsePublished,0,'aucun spectateur/banc/détail jaune/hors-cadre publié comme CAY');
assert.strictEqual(maxVisible,11,'invariant 11 joueurs simultanés respecté');
assert.strictEqual(snap.rosterTotal,11,'le roster ne gonfle pas avec les parasites synthétiques');
assert.strictEqual(snap.segmentBreaks,1,'une coupure multi-plan explicite est enregistrée');
assert.strictEqual(snap.segments,2,'deux segments vidéo sont conservés séparément');
assert(snap.rejectedDetections>=250,'les 5 parasites par frame sont rejetés de façon auditable');
assert.strictEqual(snap.rejectedByReason.spectator,50,'spectateurs rejetés sur chaque frame');
assert.strictEqual(snap.rejectedByReason.bench,50,'banc rejeté sur chaque frame');
assert.strictEqual(snap.rejectedByReason.yellow_detail_only,50,'faux CAY par détail jaune rejetés');
assert.strictEqual(snap.rejectedByReason.normalization_failed,100,'coordonnées hors cadre rejetées, jamais clampées');

const summaries=(report.players||report.playerReports||[]);
if(Array.isArray(summaries)&&summaries.length){
  assert.strictEqual(summaries.length,11,'le rapport final reste limité aux 11 identités réelles');
}

console.log(`PASS synthetic ground-truth benchmark: frames=${frames}, ids=11/11, idSwitches=${idSwitches}, falseCAY=${falsePublished}, segments=${snap.segments}, rejected=${snap.rejectedDetections}`);
