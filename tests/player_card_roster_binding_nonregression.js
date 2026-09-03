'use strict';
const assert=require('assert');
const Binding=require('../player_card_roster_binding_v1.js');
const ViewModel=require('../player_card_view_model_v1.js');

const team={
  id:'senior1',name:'C.A. Yenne Seniors 1',category:'Seniors',
  roster:[
    {id:'p1',firstName:'Louis',lastName:'Test',number:8,photoUrl:'photos/p1.jpg',primaryPosition:'CM',secondaryPosition:'AM',status:'ACTIVE'},
    {id:'p2',displayName:'Gardien Test',number:1,primaryPosition:'GK',status:'SUBSTITUTE',isGoalkeeper:true}
  ],kits:[{id:'home',name:'Domicile',shirtColor:'#c91f2d',shortsColor:'#09090b',socksColor:'#c91f2d'}]
};

const index=Binding.buildIndex(team,[
  {trackId:17,playerId:'p1',validated:true,confidence:.96,source:'manual_test'},
  {trackId:18,playerId:'p2',validated:false,confidence:1},
  {trackId:19,playerId:'p1',validated:true,confidence:.99}
]);
assert.strictEqual(index.accepted.length,1,'only one explicit one-to-one binding should be accepted');
assert.strictEqual(index.rejected.length,2,'unvalidated and duplicate-player bindings must be rejected');

const baseModel={version:'CAY_PLAYER_CARD_VIEW_MODEL_V1',players:[{id:17,category:'team'},{id:18,category:'goalkeeper'}]};
const enriched=Binding.enrichModel(baseModel,{team,bindings:[{trackId:17,playerId:'p1',validated:true,confidence:.96,source:'manual_test'}],activeKit:team.kits[0]});
assert.strictEqual(enriched.players[0].roster.status,'LIÉ');
assert.strictEqual(enriched.players[0].roster.displayName,'Louis Test');
assert.strictEqual(enriched.players[0].roster.number,8);
assert.strictEqual(enriched.players[0].roster.primaryPosition,'CM');
assert.strictEqual(enriched.players[0].roster.photoUrl,'photos/p1.jpg');
assert.strictEqual(enriched.players[0].roster.kit.id,'home');
assert.strictEqual(enriched.players[1].roster.status,'NON_LIÉ');
assert.strictEqual(enriched.players[1].roster.displayName,null,'unbound track must never infer a player identity');

const report={players:[{id:17,cat:'team',observedDuration:5,observations:4,observedVisuals:{status:'INDISPONIBLE'},metricVisuals:{status:'INDISPONIBLE'},metric:null}]};
const cardModel=ViewModel.build(report,{team,bindings:[{trackId:17,playerId:'p1',validated:true,confidence:1}]});
assert.strictEqual(cardModel.players[0].roster.playerId,'p1','view-model should consume explicit roster context');
assert.strictEqual(cardModel.players[0].metrics.distanceM.status,'INDISPONIBLE','roster identity must not weaken metric guards');

console.log('player card roster binding non-regression: PASS');
