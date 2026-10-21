# RUN120 — SLA fiable et décision open source (2026-10-20)

## Base inspectée et livraison
- Dépôt : https://github.com/Rakniel/CAY-STABLE, `main`, arbre `8a0e0e0f110f4a7a45443030f24c3c07ab387fbd`.
- Module existant étendu : `setup_sla_v1.js`, blob initial `33525d0e2e85796f33b106b01318b547ea497c54`. **Code CAY interne**, pas du code externe copié. La licence globale de CAY n'est pas déduite de la simple publication GitHub.
- Changement : durées vides, négatives, booléennes et non finies refusées ; somme débordante = NON_MESURE ; 1200 secondes = HORS_SLA puisque l'objectif est strictement « moins de 20 minutes ». Contrat des six étapes conservé.
- Test ajouté : `tests/setup_sla_evidence_integrity_nonregression.js` ; test historique `tests/setup_sla_nonregression.js` conservé.
- Tests locaux répétés : 2 suites Node et vérification syntaxique ; benchmark synthétique 100 000 évaluations, médiane avant 37,80 ms, après 35,36 ms dans le laboratoire RUN119 (variation environnementale, pas un gain utilisateur revendiqué).
- Statut : **commité sur branche RUN120, non fusionné, CI à vérifier**. Ce module n'est pas encore instrumenté dans l'interface HTML principale. Ne pas prétendre que le parcours éducateur de moins de 20 minutes est mesuré ou atteint.

## Nouvelle comparaison de réutilisation (aucun code tiers ni poids importé)

| Source / version | Licence du code | Fonction utile et remplacement visé | Décision et risques |
|---|---|---|---|
| https://github.com/roboflow/trackers — **2.6.1** (2026-09-25, PyPI) | **Apache-2.0** | ByteTrack / BoT-SORT, compensation caméra et **`update(..., timestamp=capture_seconds)`** pour les images sautées et FPS variables. À brancher **hors navigateur** via l'adaptateur MOT CAY existant, sans réécrire le suivi ni contourner les identités persistantes. | **ÉTUDIÉ**, non intégré. Python >=3.10 ; poids/détecteurs sous licences distinctes ; timestamps de capture monotones, reset au changement de vidéo/plan ; aucun HOTA SoccerNet transposable sans détecteur réel. |
| https://github.com/roboflow/sports — dépôt `main`, révision non figée | **MIT** | Référence pour keypoints de terrain, homographie et visualisation. CAY possède déjà `metric_homography_projector_v1.js` et `metric_pitch_heatmap_v1.js`. | **ÉTUDIÉ**, ne pas copier un second moteur ; auditer poids et qualité multi-plans. |
| https://github.com/TrackingLaboratory/tracklab — dépôt `main`, révision non figée | **MIT** (licence à revalider au pin) | Benchmark ReID / interop tracking ; garder `motchallenge_tracking_artifact_adapter_v1.js`. | **ÉTUDIÉ** ; dépendances/poids et performances club non validés. |
| Web Performance API (navigateur) | API native, aucune bibliothèque redistribuée | Futur chronométrage local de l'UX : équipe → roster → vidéo → analyse → lancement → premiers résultats. | **PRÉFÉRÉ**, non instrumenté ; aucune collecte réseau ni mot de passe. |

Références vérifiées : https://pypi.org/project/trackers/ ; https://trackers.roboflow.com/latest/learn/dynamic-frame-rate/ ; https://github.com/roboflow/trackers ; https://github.com/roboflow/sports ; https://github.com/TrackingLaboratory/tracklab.

**Gain de travail évité (estimation non chronométrée)** : correction SLA en extension ~0,25–0,5 jour plutôt qu'un nouveau moteur ; un adaptateur Python `trackers` éviterait à terme plusieurs jours d'implémentation et maintenance des trackers, **non mesuré et non intégré**.

## Non intégré / limites
- Une correction supplémentaire du garde de couverture `first_results_runtime_guard_bridge_v1.js` a passé 30 assertions sur un scénario synthétique (50 000 appels : 30 ms avant / 39 ms après). L'écriture distante a été **refusée par le contrôle de sécurité** : **ne pas considérer ce garde comme intégré**.
- Aucune vidéo réelle C.A. Yenne analysée. Distance, vitesse, sprints, ballon et événements demeurent INDISPONIBLE sans preuve.
- Conserver logo officiel sans transformation, interface rouge/noir, maximum 11 joueurs simultanés et roster plus large ; aucune modification visuelle dans RUN120.
