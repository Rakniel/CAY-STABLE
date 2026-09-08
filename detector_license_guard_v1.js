(function(root){
'use strict';

const VERSION='1.1.0';
const PERMISSIVE_LICENSES=new Set(['MIT','APACHE-2.0','BSD-2-CLAUSE','BSD-3-CLAUSE','ISC','CC0-1.0','UNLICENSE','CAY-INTERNAL']);
const blockedSources=[
  {
    match:'huggingface.co/lukasiktar11/football-player-detector/',
    license:'AGPL-3.0',
    status:'REJECTED_RUNTIME_DEFAULT',
    reason:'CAY-STABLE does not accept this detector as a silent default under the current license policy.'
  }
];

function normalizeLicense(value){return String(value||'').trim().toUpperCase().replace(/\s+/g,' ');}
function inspectLicense(value){
  const normalized=normalizeLicense(value);
  if(!normalized)return {allowed:false,license:normalized,reason:'LICENSE_MISSING'};
  if(PERMISSIVE_LICENSES.has(normalized))return {allowed:true,license:normalized,reason:'LICENSE_ALLOWED'};
  return {allowed:false,license:normalized,reason:'LICENSE_NOT_ALLOWLISTED'};
}
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
const api={version:VERSION,inspect,inspectLicense,normalizeLicense,allowedLicenses:Array.from(PERMISSIVE_LICENSES),blockedSources:blockedSources.map(x=>({...x}))};
root.CAYDetectorLicenseGuard=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
