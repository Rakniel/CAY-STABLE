# RUN186 — Isolation des identités par analyse (2026-10-23)

## Dépôt et point de départ
- Projet : Rakniel/CAY-STABLE.
- Branche de départ : `fix/run180-observation-evidence-fail-closed-20261023` (conserve le garde de couverture non fusionné).
- Modules réutilisés : `club_roster_identity_ui_v1.js`, `player_identity_binding_session_v1.js`, `player_card_view_model_v1.js` ; aucune nouvelle logique de matching ni nouveau backend.
- Modification : les lectures et écritures de bindings de l'interface sont désormais explicitement isolées par session d'analyse ; chaque `CAYStableTrackingBridge.create()` obtient un scope distinct, stable pendant ses appels `report()`. Les associations restent en mémoire et ne sont pas récupérées d'une vidéo précédente.
- La compatibilité de l'API legacy `createStore().bindings()/saveBindings()` sans scope est maintenue uniquement pour les tests et consommateurs historiques ; le parcours UI n'y fait plus appel.

## Limites et sécurité
- Les `analysisId`, `inputFingerprint` et `inputFingerprintSource` éventuellement fournis dans un rapport ne sont **pas** une preuve cryptographique : ils ne peuvent pas activer la persistance.
- La conservation des identités après rechargement est volontairement **INDISPONIBLE** jusqu'à l'intégration d'une empreinte SHA-256 calculée depuis les octets du fichier vidéo, avec preuve de provenance attachée au chargement.
- Le tracking pendant une analyse n'est pas modifié. La correction n'est pas une validation de qualité du tracking ni de la vidéo réelle.
- Roster > 11 autorisé ; limite de 11 joueurs simultanés inchangée. Pas de modification du logo ou de l'identité rouge/noir.

## Vérification
- Contrôle syntaxique V8 du module modifié et du test : PASS.
- Assertions ciblées en V8 : isolation entre sessions, non-persistance, refus de scopes forgés, non-mutation par copie, idempotence du patch, API legacy conservée.
- Test Node à exécuter en CI : `node tests/club_roster_analysis_scope_nonregression.js`.
- Non-régressions du dépôt complet, CI GitHub et vidéo réelle : **en attente**, ne pas annoncer STABLE validé.

## Open source : composants étudiés, non importés
| Composant | Version/révision contrôlée | Licence | Usage candidat | Remplace potentiellement | Statut / risques |
|---|---|---|---|---|---|
| Roboflow Trackers | 2.6.1, tag `3666546420b0fd564c8e63157a6621efffdfa01a` | Apache-2.0 | ByteTrack / BoT-SORT / compensation caméra / évaluation SoccerNet | Partie du moteur de tracking navigateur, après benchmark | ÉTUDIÉ, non intégré ; Python >=3.10, supervision, coûts de déploiement |
| OpenCV | >=4.5.0 | Apache-2.0 | `findHomography`/RANSAC et mouvements caméra | Calibration ad hoc, après test multi-plans | ÉTUDIÉ, non intégré ; dépendance hors navigateur |
| TrackLab | dépôt main consulté le 2026-10-23 (version non figée) | MIT | ReID et bancs d'évaluation SoccerNet | Infrastructure de benchmark à développer | ÉTUDIÉ, non intégré ; poids/datasets soumis à licences distinctes |

Aucun code ni poids de ces projets n'est copié. Les licences des modèles et jeux de données devront être auditées séparément. Le dépôt CAY lui-même indique une licence `NOASSERTION` ; aucune licence de redistribution n'est présumée.

## Impact et prochaine action
- Avant : les bindings legacy sont globaux et peuvent associer un `trackId=1` de deux vidéos distinctes.
- Après : les bindings utilisés par l'interface sont cloisonnés par instance d'analyse, sans lecture des bindings globaux.
- Gain : évite un nouveau gestionnaire d'identités ; temps économisé non chronométré. Sur le test ciblé, 0 fuite inter-sessions attendue.
- Prochaine action : lier un hash réellement calculé aux analyses pour restaurer des identités *seulement* pour le même fichier, puis tester sur vidéos C.A. Yenne et mesurer IDF1/HOTA et temps de configuration.
