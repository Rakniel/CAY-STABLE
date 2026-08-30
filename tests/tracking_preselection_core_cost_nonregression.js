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

// Garde de structure: l’adaptateur ne doit plus réimplémenter le coût d’association.
assert.strictEqual(typeof Core.matchCost,'function','Core.matchCost reste la source canonique exportée');

console.log('PASS tracking preselection/core-cost non-regression: 4/4');
