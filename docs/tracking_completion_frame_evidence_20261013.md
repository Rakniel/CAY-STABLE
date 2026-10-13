# CAY-STABLE — chronologie et capacité de fin d'analyse (13 octobre 2026)

## Provenance et changement
- Module interne CAY : `first_results_runtime_guard_bridge_v1.js`, étendu sans nouvelle dépendance.
- Le verdict de fin d'analyse refuse désormais tout horodatage négatif (vidéo à partir de 0 seconde).
- Le pic de joueurs réellement observés par image ne peut plus dépasser `summary.maxVisible`.
- Les 11 joueurs simultanés maximum restent distincts du nombre de joueurs du roster, qui peut dépasser 11 avec remplacements.
- Aucun calcul de distance, vitesse, sprint, possession ou tir n'est promu par cette validation.

## Tests
- Nouveau test : `tests/tracking_completion_frame_consistency_nonregression.js` (50 assertions par passage, 5 répétitions internes).
- Ancien test conservé : `tests/tracking_completion_evidence_nonregression.js` (82 assertions).
- Scénarios synthétiques : avant 10 décisions incorrectes / 60 ; après 0 / 60, sur 5 répétitions de 12 cas.
- Mesure indicative en environnement JS isolé : 10 000 images × 5 verdicts, 25 ms avant / 21 ms après ; ne constitue pas un benchmark navigateur.
- CI GitHub Actions, test sur vidéo réelle C.A. Yenne et parcours éducateur <20 minutes encore requis avant fusion.

## Composants externes
Aucun code ni modèle tiers ajouté ; réutilisation du garde CAY existant. Les audits et licences ByteTrack, BoT-SORT, OpenCV, TrackLab et autres candidats restent documentés dans `OPEN_SOURCE_COMPONENTS.md` et `docs/`. Aucun gain de temps externe nouveau revendiqué.
