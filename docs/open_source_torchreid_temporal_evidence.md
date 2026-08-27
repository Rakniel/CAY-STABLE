# Torchreid / OSNet — adaptation de diversité temporelle ReID

## Source inspectée
- Projet : `KaiyangZhou/deep-person-reid` (Torchreid / OSNet)
- Révision inspectée : `f8cd150fdf77e8d9e1ed143b7f308c2c609ded50` (2026-01-09)
- Licence du code : MIT
- Fichier licence vérifié : `LICENSE` du dépôt upstream
- Aucun poids de modèle, dataset, image d'entraînement ni code upstream n'est copié dans CAY-STABLE.

## Idée réutilisée
Torchreid prend en charge le ReID image et vidéo. CAY-STABLE adapte uniquement l'idée générale du ReID vidéo : une identité ne doit pas être soutenue par une rafale d'images presque identiques considérées artificiellement comme des preuves indépendantes. Les embeddings provenant d'instants trop proches sont donc regroupés implicitement en ne conservant qu'un représentant de meilleure qualité dans une fenêtre temporelle minimale.

## Modification CAY-STABLE
Fichier modifié : `reid_evidence_fusion_v1.js`.

- Ajout de `minTemporalSeparation` (0,35 s par défaut lorsque des timestamps sont disponibles).
- Ajout de `temporalDiverseSamples()` : sélection déterministe d'observations temporellement séparées, en privilégiant la meilleure qualité lorsqu'une rafale tombe dans le même épisode visuel.
- `minSamples` est désormais évalué sur les preuves temporellement diverses, pas seulement sur le nombre brut de frames.
- Diagnostics enrichis avec `rawSamples`, `effectiveSamples` et `evidencePolicy: TEMPORALLY_DIVERSE_SAMPLES`.
- Compatibilité conservée pour les flux sans timestamp : aucune observation n'est supprimée si la diversité temporelle ne peut pas être défendue.
- Politique inchangée : `NEVER_AUTO_MERGE`. Le ReID ne produit qu'une suggestion à vérifier.

## Ce que cela remplace
Avant cette modification, 3 embeddings capturés à quelques dizaines de millisecondes d'intervalle pouvaient satisfaire `minSamples=3`. Une seule occlusion, un flou ou une confusion de maillot pouvait ainsi être surpondéré. La nouvelle logique exige des observations issues d'instants distincts lorsqu'un temps vidéo fiable est disponible.

## Validation
Test étendu : `tests/reid_evidence_fusion_nonregression.js`.

Scénario ajouté :
- observations à 0,00 / 0,04 / 0,08 s ;
- résultat attendu : 3 échantillons bruts mais 1 seule preuve effective, donc ReID `INDISPONIBLE` ;
- après ajout d'observations à 0,40 et 0,80 s : 3 preuves effectives, suggestion ReID autorisée mais jamais fusion automatique.

Les vérifications locales ont exécuté `node --check` puis le test ciblé deux fois avec succès avant commit sur la branche d'intégration.

## Dépendances et risques
- Aucune nouvelle dépendance runtime.
- Aucun PyTorch/ONNX imposé par cette adaptation.
- Risque : une valeur `0,35 s` trop élevée pourrait ralentir la ré-identification sur des séquences très courtes ; elle devra être mesurée sur les vidéos réelles du club avant assouplissement.
- Si les timestamps sont absents ou non fiables, CAY-STABLE conserve le comportement historique au lieu d'inventer une diversité temporelle.
