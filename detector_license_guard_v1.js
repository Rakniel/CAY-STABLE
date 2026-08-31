(function(root){
'use strict';

const VERSION='1.0.0';
const blockedSources=[
  {
    match:'huggingface.co/lukasiktar11/football-player-detector/',
    license:'AGPL-3.0',
    status:'REJECTED_RUNTIME_DEFAULT',
    reason:'CAY-STABLE does not accept this detector as a silent default under the current license policy.'
  }
];

function urlOf(input){
  if(typeof input==='string')return input;
  if(input&&typeof input.url==='string')return input.url;
  try{return String(input||'');}catch(_){return '';}
}
function inspect(input){
  const url=urlOf(input);
  const rule=blockedSources.find(x=>url.includes(x.match));
  return rule?{allowed:false,url,license:rule.license,status:rule.status,reason:rule.reason}:{allowed:true,url};
}

const nativeFetch=typeof root.fetch==='function'?root.fetch.bind(root):null;
async function guardedFetch(input,init){
  const verdict=inspect(input);
  if(!verdict.allowed){
    const err=new Error('CAY-STABLE licence: détecteur distant bloqué ('+verdict.license+'). Utilise uniquement un modèle local dont la licence a été validée pour CAY-STABLE.');
    err.code='CAY_LICENSE_BLOCKED';
    err.license=verdict.license;
    err.url=verdict.url;
    throw err;
  }
  if(!nativeFetch)throw new Error('fetch indisponible');
  return nativeFetch(input,init);
}

if(nativeFetch){
  try{root.fetch=guardedFetch;}catch(_){/* read-only host: inspection API still available */}
}
root.CAYDetectorLicenseGuard={version:VERSION,inspect,blockedSources:blockedSources.map(x=>({...x}))};
})(typeof globalThis!=='undefined'?globalThis:window);
