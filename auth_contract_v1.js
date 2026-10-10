(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYAuthContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ROLES=new Set(['EDUCATOR','MANAGER','ADMIN']);
  const clean=v=>String(v==null?'':v).trim();
  const identityClaim=v=>typeof v==='string'?v.trim():'';
  function assertNoSecrets(value,path='root',seen=new Set()){
    if(!value||typeof value!=='object')return;
    if(seen.has(value))return;seen.add(value);
    if(Array.isArray(value)){value.forEach((v,i)=>assertNoSecrets(v,`${path}[${i}]`,seen));return;}
    for(const [key,next] of Object.entries(value)){
      const normalized=key.replace(/[^a-z0-9]/gi,'').toLowerCase();
      if(['password','passwordhash','token','accesstoken','refreshtoken','secret','apikey'].includes(normalized))throw new Error(`AUTH_SECRET_FORBIDDEN:${path}.${key}`);
      assertNoSecrets(next,`${path}.${key}`,seen);
    }
  }
  function createAuthState(raw={}){
    assertNoSecrets(raw);
    const role=identityClaim(raw.role).toUpperCase();
    if(role&&!ROLES.has(role))throw new Error('AUTH_ROLE_INVALID');
    const backendConfigured=raw.backendConfigured===true;
    const userId=identityClaim(raw.userId);
    const provider=identityClaim(raw.provider);
    // UI contract only; a real backend must verify sessions.
    const authenticated=backendConfigured&&raw.authenticated===true&&!!userId&&!!role&&!!provider;
    return {version:'CAY_AUTH_CONTRACT_V1',backendConfigured,authenticated,userId:authenticated?userId:null,role:authenticated?role:null,provider:backendConfigured?(provider||null):null,status:!backendConfigured?'BACKEND_REQUIRED':authenticated?'AUTHENTICATED':'SIGNED_OUT',policy:'NO_FAKE_AUTH_NO_PLAINTEXT_SECRET_FRONTEND; CONTRACT_ONLY_BACKEND_SESSION_VERIFICATION_REQUIRED'};
  }
  function requireAuthenticated(state){
    const auth=createAuthState(state||{});
    return {allowed:auth.status==='AUTHENTICATED',status:auth.status,reason:auth.status==='AUTHENTICATED'?null:auth.status};
  }
  function requireRole(state,allowedRoles=[]){
    const auth=createAuthState(state||{});
    if(auth.status!=='AUTHENTICATED')return {allowed:false,status:auth.status,reason:auth.status};
    const allowed=new Set((allowedRoles||[]).map(x=>clean(x).toUpperCase()).filter(x=>ROLES.has(x)));
    const ok=auth.role!==null&&allowed.has(auth.role);
    return {allowed:ok,status:auth.status,reason:ok?null:'ROLE_FORBIDDEN'};
  }
  return {ROLES,assertNoSecrets,createAuthState,requireAuthenticated,requireRole};
});
