'use strict';

// Clean-room CAY-STABLE synthetic benchmark fixture.
// Design inspiration only: rafaelsouza-tech/soccer-tactical-vision (MIT).
// No upstream implementation code is copied here.

const Tracking=require('./tracking_core_v1.js');

function clamp01(v){ return Math.max(0,Math.min(1,v)); }

function featureForPlayer(index){
  // Deliberately separated embeddings so the existing appearance-based ReID
  // has deterministic identity evidence across camera cuts.
  return [index/11,(11-index)/11,(index%3)/3,(index%5)/5];
}

function groundTruthPoint(playerIndex,frame,totalFrames){
  const lane=(playerIndex+1)/12;
  const phase=frame/Math.max(1,totalFrames-1);
  return {
    x:clamp01(.08+.78*phase+.012*Math.sin(frame*.31+playerIndex)),
    y:clamp01(.06+.88*lane+.009*Math.cos(frame*.23+playerIndex*.7))
  };
}

function cameraTransform(point,frame,segment){
  // Synthetic pan + mild zoom in normalized image coordinates.
  // Segment 2 intentionally changes camera pose to emulate a multi-plan cut.
  const panX=segment===1 ? .025*Math.sin(frame*.17) : -.055+.018*Math.sin(frame*.13);
  const panY=segment===1 ? .012*Math.cos(frame*.11) : .035+.010*Math.cos(frame*.09);
  const zoom=segment===1 ? 1+.018*Math.sin(frame*.07) : .94+.012*Math.cos(frame*.08);
  return {
    x:clamp01(.5+(point.x-.5)*zoom+panX),
    y:clamp01(.5+(point.y-.5)*zoom+panY)
  };
}

function visible(playerIndex,frame){
  // Deterministic short occlusion windows. Never hide more than two players.
  if(playerIndex===2 && frame>=9 && frame<=11)return false;
  if(playerIndex===7 && frame>=17 && frame<=18)return false;
  return true;
}

function generateFixture(options){
  options=options||{};
  const players=Math.max(1,Math.min(11,options.players||11));
  const frames=Math.max(12,options.frames||30);
  const cutFrame=Math.max(6,Math.min(frames-5,options.cutFrame||15));
  const data=[];
  for(let frame=0;frame<frames;frame++){
    const segment=frame<cutFrame?1:2;
    const detections=[];
    const truth=[];
    for(let p=0;p<players;p++){
      const gt=groundTruthPoint(p,frame,frames);
      const isVisible=visible(p,frame);
      truth.push({playerId:p+1,visible:isVisible,segment,...gt});
      if(!isVisible)continue;
      const observed=cameraTransform(gt,frame,segment);
      detections.push({
        playerId:p+1,
        cat:p===0?'goalkeeper':'team',
        x:observed.x,
        y:observed.y,
        score:.94,
        feature:featureForPlayer(p)
      });
    }
    data.push({frame,time:frame,segment,detections,truth});
  }
  return {players,frames,cutFrame,data};
}

function runFixture(fixture,options){
  options=options||{};
  const state=Tracking.createState();
  const idByPlayer=new Map();
  let visibleTruth=0;
  let assignedVisibleTruth=0;
  let continuityHits=0;
  let continuityChecks=0;
  let cutApplied=false;
  let maxPublished=0;

  for(const sample of fixture.data){
    if(sample.segment===2&&!cutApplied){
      Tracking.startSegment(state,'synthetic_camera_cut');
      cutApplied=true;
    }
    const assigned=Tracking.assignFrame(state,sample.detections,sample.time,{
      maxPlayers:11,
      lostAfter:4,
      reidentifyArchived:true,
      reidAppearanceThreshold:.12,
      maxReidGap:60,
      reidScoreThreshold:.70,
      reidScoreUniquenessMargin:.025,
      baseThreshold:.58
    });
    maxPublished=Math.max(maxPublished,assigned.length);
    const byPlayer=new Map();
    for(const a of assigned)if(Number.isFinite(a.playerId))byPlayer.set(a.playerId,a.trackId);
    for(const gt of sample.truth){
      if(!gt.visible)continue;
      visibleTruth++;
      const trackId=byPlayer.get(gt.playerId);
      if(trackId==null)continue;
      assignedVisibleTruth++;
      if(idByPlayer.has(gt.playerId)){
        continuityChecks++;
        if(idByPlayer.get(gt.playerId)===trackId)continuityHits++;
      }else idByPlayer.set(gt.playerId,trackId);
    }
  }

  const summary=Tracking.summary(state);
  const coverage=visibleTruth?assignedVisibleTruth/visibleTruth:0;
  const continuity=continuityChecks?continuityHits/continuityChecks:1;
  return {
    fixture:{players:fixture.players,frames:fixture.frames,cutFrame:fixture.cutFrame},
    visibleTruth,
    assignedVisibleTruth,
    coverage:+coverage.toFixed(6),
    continuityChecks,
    continuityHits,
    idContinuity:+continuity.toFixed(6),
    maxPublished,
    rosterTotal:summary.rosterTotal,
    segments:summary.segments,
    reidentified:summary.reidentified,
    passed:maxPublished<=11&&coverage>=.98&&continuity>=.98&&summary.segments===2
  };
}

module.exports={generateFixture,runFixture,groundTruthPoint,cameraTransform,featureForPlayer};
