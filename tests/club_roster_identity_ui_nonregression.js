'use strict';
const assert=require('assert');
const fs=require('fs');
const UI=require('../club_roster_identity_ui_v1.js');
const Domain=require('../app_domain_models_v1.js');

function fakeStorage(){
  const values=new Map();
  return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value))};
}

const draft=UI.sanitizePlayerDraft({id:'p8',displayName:'Milieu Test',number:'8',primaryPosition:'cm',photoUrl:'https://example.test/p8.jpg'});
assert.strictEqual(draft.number,8);
assert.strictEqual(draft.primaryPosition,'CM');
assert.strictEqual(draft.status,'ACTIVE');

const storage=fakeStorage(),store=UI.createStore(storage);
const saved=store.saveTeam({id:'cay_team',name:'C.A. Yenne',category:'SENIOR',roster:[draft,{id:'p9',displayName:'Attaquant Test',number:9,primaryPosition:'ST'},{id:'p12',displayName:'Remplaçant Test',number:12,primaryPosition:'CM'},{id:'bad',displayName:'Invalide',number:120,primaryPosition:'CM'}],defaultLineup:['p8','p9'],bench:['p12']});
assert.strictEqual(saved.name,'C.A. Yenne');
assert.strictEqual(saved.roster.length,3,'invalid roster entries must not leak into the persisted club team');
assert.strictEqual(saved.roster[0].id,'p8');
assert.strictEqual(store.team().roster[0].number,8);
assert.deepStrictEqual(saved.defaultLineup,['p8','p9'],'selected on-field players must survive roster UI normalization');
assert.deepStrictEqual(saved.bench,['p12'],'bench selection must survive roster UI normalization');
assert.deepStrictEqual(store.team().defaultLineup,['p8','p9'],'selected on-field players must survive storage round-trip');
assert.deepStrictEqual(store.team().bench,['p12'],'bench selection must survive storage round-trip');
assert.strictEqual(Domain.validateLineup(store.team()).valid,true,'persisted roster state must remain launch-valid');

store.saveBindings([{trackId:3,playerId:'p8',validated:true,confidence:1,source:'coach_click'}]);
assert.deepStrictEqual(store.bindings(),[{trackId:3,playerId:'p8',validated:true,confidence:1,source:'coach_click'}]);
assert(!UI.TEAM_KEY.toLowerCase().includes('password'));
assert(!UI.BINDING_KEY.toLowerCase().includes('password'));

const source=fs.readFileSync(require.resolve('../club_roster_identity_ui_v1.js'),'utf8');
assert(source.includes("confirmed:true,source:'coach_click'"),'identity assignment must remain an explicit coach action');
assert(source.includes('Aucune identité automatique'),'UI must say that identities are not inferred automatically');
assert(source.includes('11 CAY maximum simultanément'),'club roster UI must preserve the 11 simultaneous-player rule');
assert(source.includes("root.CAYPlayerCardRenderer?.render"),'validated roster identity must refresh the defended player-card renderer');
assert(source.includes('defaultLineup:(team.defaultLineup||[]).filter'),'removing a player must also remove stale on-field references');
assert(source.includes('bench:(team.bench||[]).filter'),'removing a player must also remove stale bench references');

const vm=fs.readFileSync(require.resolve('../player_card_view_model_v1.js'),'utf8');
assert(vm.includes("script.src='./club_roster_identity_ui_v1.js'"),'STABLE player-card chain must load the roster/identity UI locally');
assert(vm.includes("setTimeout(loadClubRosterIdentityUI,0)"),'club UI loader must run after the view-model global is published');

console.log('club roster identity UI non-regression: PASS');
