# OSS audit — SoccerTrack v2

Date d'audit : 2026-09-13

## Source et version vérifiée

- Projet : `AtomScott/SoccerTrack-v2`
- Révision vérifiée : `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3` (2026-08-11)
- Rôle étudié pour CAY-STABLE : benchmark plein-terrain / multi-vues pour Game State Reconstruction, tracking persistant, coordonnées terrain et évaluation GS-HOTA.

## Licence

- Code : MIT.
- Dataset/annotations : CC BY 4.0.
- Conclusion : permissif pour étude/benchmark avec attribution, mais les données et le code gardent des obligations distinctes. Aucun fichier de code, modèle ou donnée n'est embarqué dans CAY-STABLE par cet audit.

## Ce qui est utile pour CAY-STABLE

SoccerTrack v2 fournit un benchmark football récent avec positions métriques terrain, identités persistantes et tâches GSR proches de notre cible. Le gain principal n'est pas d'importer son runtime : c'est d'éviter de concevoir de zéro un protocole d'évaluation multi-vues/pitch-space lorsque CAY sera prêt à benchmarker tracking + projection terrain.

Cible d'adaptation future : convertir une sortie CAY auditée vers un format d'évaluation dédié, sans introduire SoccerTrack v2 dans le runtime navigateur et sans contourner les gates CAY (identité, couverture, calibration, roster).

## Risques observés à la révision auditée

Le dépôt amont documente lui-même, au commit vérifié, des divergences entre la spécification GSR et les fichiers effectivement livrés (structure SoccerNet-COCO, identifiants d'image, champs imbriqués, dimensions déclarées et cas temporel de seconde mi-temps). Le commit audité contient justement des corrections visant à rendre GS-HOTA exécutable et signale ces écarts de format.

Conséquence CAY : **ne pas brancher directement le parseur ou les fichiers de ce benchmark dans STABLE**. Toute future utilisation doit être isolée dans un adaptateur de benchmark, verrouillée sur une révision précise et testée par une identité GT→GT avant comparaison avec CAY.

## Décision

- Statut : **ÉTUDIÉ / BENCHMARK CANDIDAT, NON INTÉGRÉ AU RUNTIME**.
- Code copié : non.
- Dépendance runtime ajoutée : aucune.
- Ce que cela peut remplacer : conception maison d'un protocole de benchmark multi-vues/GSR et d'une partie du format d'échange d'évaluation.
- Travail potentiellement évité : ~0,5 à 1,5 jour lors de la future phase de benchmark, sous réserve d'un adaptateur CAY et des vérifications de format ci-dessus.
- Impact attendu : mesure plus objective de la persistance d'identité et de la cohérence pitch-space ; aucun impact runtime immédiat.

## Règle d'intégration future

Avant toute réutilisation de code ou donnée : revalider la licence à la révision choisie, figer le commit, conserver les attributions, vérifier séparément les licences des poids/modèles éventuels, et ne promouvoir aucun résultat si l'adaptateur ne passe pas les tests d'identité et les gates de fiabilité CAY.
