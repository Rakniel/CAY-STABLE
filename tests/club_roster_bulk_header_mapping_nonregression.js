'use strict';
const assert=require('node:assert/strict');
const Domain=require('../app_domain_models_v1.js');
const Papa=require('../vendor/papaparse.min.js');
const UI=require('../club_roster_identity_ui_v1.js');
const team=Domain.createTeam({id:'seniors',name:'C.A. Yenne',roster:[{id:'gk',displayName:'Gardien',number:1,primaryPosition:'GK'}]});
const cases=[
  ['canonical','Numéro;Nom;Poste\n7;Rémi;CM',true,7],
  ['legacy hash','#;Nom;Poste\n7;Rémi;CM',true,7],
  ['reordered','Nom;Numéro;Poste\nRémi;7;CM',true,7],
  ['Excel tabs','Joueur\tN°\tPosition\nRémi\t7\tCM',true,7],
  ['no number','Nom;Poste\nRémi;CM',true,null],
  ['no position','Nom;Numéro\nRémi;7',true,7],
  ['unheaded','7;Rémi;CM',true,7],
  ['bad position','Nom;Numéro;Poste\nRémi;7;CM\nBob;8;INVALID',false,'INVALID_PRIMARY_POSITION'],
  ['missing column','Nom;Numéro;Poste\nRémi;7',false,'ROSTER_IMPORT_COLUMNS_INVALID'],
  ['duplicate','1;Gardien;GK',false,'ROSTER_IMPORT_DUPLICATE_PLAYER'],
  ['invalid number','0;Rémi;CM',false,'INVALID_SHIRT_NUMBER'],
  ['unknown header','Autre;Nom;Poste\n7;Rémi;CM',false,'INVALID_SHIRT_NUMBER']
];
let checks=0;
for(let run=0;run<5;run++){
 for(const [label,csv,accepted,expected] of cases){
  const result=UI.prepareRosterImport(csv,Papa,team);
  assert.equal(result.accepted,accepted,label);
  if(accepted)assert.equal(result.team.roster[1].number,expected,label+' shirt');
  else assert.equal(result.reason,expected,label+' reason');
  checks+=2;
 }
 const invalid=UI.prepareRosterImport('Nom;Numéro;Poste\nRémi;7;CM\nBob;8;INVALID',Papa,team);
 assert.equal(invalid.line,3);
 const incomplete=UI.prepareRosterImport('Nom;Numéro;Poste\nRémi;7',Papa,team);
 assert.equal(incomplete.line,2);
 const plain=UI.prepareRosterImport('8;Alice;CM\n9;Bob;ST',Papa,team);
 assert.equal(plain.added,2);
 const dup=UI.prepareRosterImport('Numéro;Nom;Poste\n8;Alice;CM\n8;Alice;CM',Papa,team);
 assert.equal(dup.reason,'ROSTER_IMPORT_DUPLICATE_PLAYER');
 const big=UI.prepareRosterImport(Array.from({length:15},(_,i)=>(i+2)+';Joueur '+i+';CM').join('\n'),Papa,team);
 assert.equal(big.team.roster.length,16);
 assert.equal(team.roster.length,1);
 checks+=6;
}
console.log(checks+'/'+checks+' roster header mapping non-regression: PASS');
