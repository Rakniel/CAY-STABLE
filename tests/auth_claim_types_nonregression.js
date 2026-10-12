'use strict';
const assert=require('node:assert/strict');
const Auth=require('../auth_contract_v1.js');
const complete={backendConfigured:true,authenticated:true,userId:'u-1',role:'EDUCATOR',provider:'oidc'};
for(const key of ['userId','provider','role'])for(const value of [0,1,true,false,[],['valid'],{},new Date(0)]){
 const input={...complete,[key]:value};
 assert.equal(Auth.createAuthState(input).status,'SIGNED_OUT');
 assert.equal(Auth.requireAuthenticated(input).allowed,false);
 assert.equal(Auth.requireRole(input,['EDUCATOR']).allowed,false);
}
assert.equal(Auth.createAuthState(complete).status,'AUTHENTICATED');
console.log('auth_claim_types_nonregression: PASS');
