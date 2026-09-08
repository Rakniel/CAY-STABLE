const assert=require('assert');
const Core=require('../tracking_core_v1.js');
const Adapter=require('../tracking_two_stage_adapter_v1.js');

const state=Core.createState();
const first=Core.assignFrame(state,[{
  cat:'team',x:.20,y:.40,score:.95,feature:[.10,.20,.30]
}],0,{maxPlayers:1});
assert.strictEqual(first.length,1,'fixture: une piste active');

const track=state.active[0];
track.missed=5;

// Ce candidat reste géométriquement plausible, mais son coût Core dépasse
// le seuil de présélection une fois la pénalité de piste manquée incluse.
const staleMatch={cat:'team',x:.40,y:.40,score:.56,feature:[.10,.20,.30]};
const clutter={cat:'team',x:.95,y:.05,score:.99,feature:[8,8,8]};
const coreCost=Core.matchCost(track,staleMatch,.5);
assert(coreCost>.72,'fixture: le coût canonique Core doit dépasser le seuil');

const selected=Adapter.preselectAssociationCandidates(
  state,[staleMatch,clutter],.5,1,{associationPreselectionThreshold:.72}
);
assert.strictEqual(selected.length,1,'une seule place de présélection');
assert.strictEqual(selected[0],clutter,'la présélection suit le coût Core et retombe sur le meilleur score quand aucun match n’est admissible');

// Les options du coût canonique doivent également atteindre la présélection.
// Sans la garde directionnelle, les deux candidats sont spatialement symétriques
// autour de la prédiction et l’ordre d’entrée favoriserait artificiellement le retour arrière.
const directionalTrack={
  globalId:99,cat:'team',missed:0,seen:3,archived:false,
  x:.40,y:.50,feature:[.25,.25,.25],appearanceGallery:[],
  motionHistory:[{x:.30,y:.50,time:0},{x:.40,y:.50,time:1}]
};
const directionalState={active:[directionalTrack]};
const reverse={cat:'team',x:.39,y:.50,score:.99,feature:[.25,.25,.25]};
const forward={cat:'team',x:.61,y:.50,score:.80,feature:[.25,.25,.25]};
const directionOpts={
  associationPreselectionThreshold:.72,
  directionConsistencyEnabled:true,
  directionPenaltyWeight:.18,
  directionMinMotion:.003
};
assert(Core.matchCost(directionalTrack,reverse,2,directionOpts)>Core.matchCost(directionalTrack,forward,2,directionOpts),
  'fixture: le coût canonique avec options doit pénaliser le retour arrière');
const directionalSelected=Adapter.preselectAssociationCandidates(
  directionalState,[reverse,forward],2,1,directionOpts
);
assert.strictEqual(directionalSelected[0],forward,
  'la présélection doit transmettre les options Core et conserver le candidat cohérent avec la direction');

// Garde de structure: l’adaptateur ne doit plus réimplémenter le coût d’association.
assert.strictEqual(typeof Core.matchCost,'function','Core.matchCost reste la source canonique exportée');

console.log('PASS tracking preselection/core-cost non-regression: 6/6');
