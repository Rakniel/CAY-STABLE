'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Source=require('../staff_video_source_v1.js');
const html=fs.readFileSync(path.join(__dirname,'..','staff_tactics.html'),'utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(script);
let checks=0;
const equal=(a,b,label)=>{assert.equal(a,b,label);checks++;};
class Node {
  constructor(id=''){this.id=id;this.value='';this.textContent='';this.dataset={};this.style={};this.files=[];this.children=[];this.checked=false;this.disabled=false;this.focused=false;this.classList={remove(){},toggle(){}};}
  append(...elements){this.children.push(...elements);}
  replaceChildren(...elements){this.children=elements;}
  addEventListener(type,fn){this['on'+type]=fn;}
  setAttribute(){}
  focus(){this.focused=true;}
}
const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>[match[1],new Node(match[1])]));
const document={readyState:'complete',getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],createElement:tag=>new Node(tag),createElementNS:(ns,tag)=>new Node(tag),addEventListener(){}};
const db=new Map();
const localStorage={getItem:key=>db.has(key)?db.get(key):null,setItem:(key,value)=>db.set(key,String(value))};
const Engine={
  formationNames:()=>['4-3-3'],
  ACTIONS:['THROW_IN','BALL_GAIN','BALL_LOSS','OFFSIDE'],
  SHAPES:{'4-3-3':true},PLAYS:{},
  makeFormation:()=>Array.from({length:11},(_,i)=>({role:i?'ST':'GK',x:8+i*7,y:50})),
  placeLineup:()=>[],normalizeSheet:()=>({}),
  observation:input=>input,
  summarizeObservations:rows=>({total:rows.length,confirmed:rows.filter(r=>r.evidenceState==='COACH_CONFIRMED').length,throwIns:{confirmed:0,evaluable:0,retentionPct:null},grouped:{BALL_LOSS:{confirmed:0},BALL_GAIN:{confirmed:0},OFFSIDE:{confirmed:0}},risks:[]})
};
const window={CAYStaffTacticalEngine:Engine,CAYAppDomainModels:{createPlayer:x=>x},CAYClubRosterIdentityUI:{currentTeam:()=>({id:'cay_team',roster:[]}),createStore:()=>({saveTeam(){}})},CAYStaffVideoSource:Source,localStorage,open(){}};
new Function('document','window','localStorage','confirm',script)(document,window,localStorage,()=>true);
equal(nodes.observationFilter.children.length,Engine.ACTIONS.length,'filter options');
equal(nodes.matchId.disabled,false,'match unlocked before annotations');
nodes.albertvilleVeoFixture.onclick();
equal(nodes.opponent.value,'U.O. Albertville','fixture opponent');
equal(nodes.venue.value,'Stade Charles-Burdinat','fixture venue');
const url='https://app.veo.co/matches/20261011-example-match123';
nodes.externalVideoUrl.value=url;
equal(nodes.externalVideoUrl.onchange(),true,'Veo source bound');
nodes.actionType.value='THROW_IN';nodes.eventTeam.value='CAY';nodes.zone.value='MIDDLE_THIRD';nodes.outcome.value='LOST';nodes.coachName.value='coach';nodes.confirmEvent.checked=true;
nodes.videoTime.value='';
nodes.addObservation.onclick();
equal(nodes.eventList.children.length,0,'blank timestamp rejected');
equal(nodes.saveState.textContent.includes('HORODATAGE_VIDEO_REQUIS'),true,'blank timestamp error shown');
nodes.videoTime.value='75';nodes.observationNotes.value='Aucun appui court';
nodes.addObservation.onclick();
equal(nodes.eventList.children.length,1,'annotation appears');
equal(nodes.matchId.disabled,true,'match ID locked');
equal(nodes.videoId.disabled,true,'video ID locked');
equal(nodes.eventList.children[0].children[0].textContent.includes('Aucun appui court'),true,'notes visible');
nodes.videoTime.value='0';
nodes.eventList.children[0].children[1].onclick();
equal(nodes.videoTime.value,'75','timestamp restored');
equal(nodes.videoTime.focused,true,'time input focused');
equal(nodes.saveState.textContent.includes('1:15'),true,'repere displayed');
nodes.observationFilter.value='OFFSIDE';nodes.observationFilter.onchange();
equal(nodes.eventList.children.length,0,'filtered by action');
equal(nodes.observationCount.textContent.includes('0 affichées / 1'),true,'count reflects filter');
nodes.observationFilter.value='ALL';nodes.observationFilter.onchange();
equal(nodes.eventList.children.length,1,'all observations restored');
const saved=JSON.parse(localStorage.getItem('CAY_STAFF_MATCH_ARCHIVE_V1'));
equal(saved['CAY-2026-10-11-UO-ALBERTVILLE'].observations.length,1,'annotation archived');
nodes.externalVideoUrl.value='https://app.veo.co/matches/another-match123';
equal(nodes.externalVideoUrl.onchange(),false,'conflicting source refused');
equal(nodes.externalVideoUrl.value,url,'source restored');
nodes.eventList.children[0].children[2].onclick();
equal(nodes.matchId.disabled,false,'match unlocked after removal');
nodes.newMatch.onclick();
equal(nodes.videoId.disabled,false,'new match video source unlocked');
equal(nodes.eventList.children.length,0,'new match journal clean');
console.log('CAY Veo manual review: '+checks+' assertions OK');
