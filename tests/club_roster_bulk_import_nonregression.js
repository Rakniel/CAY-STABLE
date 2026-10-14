'use strict';
const assert=require('assert');
const Domain=require('../app_domain_models_v1.js');
const Papa=require('../vendor/papaparse.min.js');
const UI=require('../club_roster_identity_ui_v1.js');
let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const team=Domain.createTeam({id:'seniors',name:'C.A. Yenne',roster:[{id:'gk',displayName:'Gardien',number:1,primaryPosition:'GK'}]});
for(let run=0;run<5;run++){
  const result=UI.prepareRosterImport('numéro;nom;poste\n8;Léo Dupont;CM\n9;"Martin, Paul";ST\n10;Émilie Bernard;LW',Papa,team);
  ok(result.accepted===true,'valid quoted CSV accepted');
  ok(result.added===3,'three players imported');
  ok(result.team.roster[2].displayName==='Martin, Paul','CSV quoted comma');
  ok(team.roster.length===1,'original roster unchanged');
  ok(UI.prepareRosterImport('8;Alice;CM\n9;Bob;TREE',Papa,team).reason==='INVALID_PRIMARY_POSITION','invalid position fails closed');
  ok(UI.prepareRosterImport('1;Gardien;GK',Papa,team).reason==='ROSTER_IMPORT_DUPLICATE_PLAYER','existing duplicate rejected');
  ok(UI.prepareRosterImport('8;Alice;CM\n8;Alice;CM',Papa,team).reason==='ROSTER_IMPORT_DUPLICATE_PLAYER','intra-batch duplicate rejected');
  ok(UI.prepareRosterImport('8;Alice;CM\n9',Papa,team).accepted===false,'incomplete row rejected');
  ok(UI.prepareRosterImport('8\tAlice\tCM\n9\tBob\tST',Papa,team).added===2,'Excel tab paste accepted');
  ok(UI.prepareRosterImport('8;Alice;CM',null,team).reason==='CSV_PARSER_REQUIRED','parser missing fails closed');
  const big=Array.from({length:15},(_,i)=>(i+1)+';Joueur '+i+';CM').join('\n');
  ok(UI.prepareRosterImport(big,Papa,team).team.roster.length===16,'roster >11 allowed');
  ok(Domain.validateLineup(result.team).errors.includes('LINEUP_EMPTY'),'import never invents on-field lineup');
}
console.log(checks+'/'+checks+' CAY roster bulk import non-regression: PASS');
