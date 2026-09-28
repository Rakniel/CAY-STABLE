'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'CAY_ANALYZER_STABLE.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

let checks=0;
function ok(v,msg){assert.ok(v,msg);checks++;}

ok(app===index,'index.html doit rester bit-a-bit identique au build STABLE principal');
ok(!app.includes('#autoTestSection,#engineSection,#readySection,#results,#trackingSection{display:none!important}'),'résultats/tracking ne doivent plus être masqués par le CSS historique');
ok(app.includes("const CAY_GLOBAL_PROFILE_KEY='CAY_STABLE_GLOBAL_TEAM_PROFILE_V1';"),'profil CAY global persistant présent');
ok(app.includes('function restoreGlobalCAYProfile()'),'restauration automatique du profil CAY présente');
ok(app.includes('function saveGlobalCAYProfile()'),'sauvegarde automatique du profil CAY présente');
ok(app.includes("setTimeout(()=>{if(currentFile&&expressAnalysisArmed&&!expressAnalysisRunning&&!$('scanBtn').disabled)$('scanBtn').click();},250);"),'le scan caméra démarre automatiquement après chargement vidéo');
ok(app.includes("setTimeout(()=>{if(!expressAnalysisRunning)runFullValidation55();},100);"),'le scan lance automatiquement l analyse si le profil CAY existe');
ok(app.includes("status($('guidedStatus'),'Première utilisation : sélectionne quelques joueurs CAY une seule fois."),'première utilisation clairement limitée à un apprentissage CAY unique');
ok(app.includes("status($('guidedStatus'),'Profil CAY mémorisé ✓ • l’analyse complète démarre automatiquement."),'fin apprentissage relance automatiquement l analyse');
ok(app.includes("$('results').classList.remove('hidden');"),'les résultats sont explicitement affichés en fin d analyse');
ok(app.includes("const resultTarget=$('stablePlayerStatsV2')||$('results')||$('trackingSection');"),'le parcours amène automatiquement l utilisateur vers les résultats');
ok(app.includes('if(expressAnalysisRunning)return lastValidation55;'),'double lancement analyse empêché');

console.log(`${checks}/${checks} express video-to-results non-regression: PASS`);
