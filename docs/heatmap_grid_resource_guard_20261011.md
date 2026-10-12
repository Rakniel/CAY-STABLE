# CAY-STABLE — borne de ressources des heatmaps (2026-10-11)

## Origine et périmètre
- Module CAY existant : `metric_pitch_heatmap_v1.js`.
- Correctif issu du travail CAY de garde de grille préparé le 2026-10-10 ; **aucun code tiers importé**.
- Références OSS déjà évaluées dans `OPEN_SOURCE_COMPONENTS.md` : mplsoccer (MIT, principe de binning), OpenCV (Apache-2.0, calibration). Aucune bibliothèque ni poids de modèle ajouté ; versions et licences upstream inchangées.
- Modifications : validation des options `cols` / `rows`, limite de **128 cellules par dimension**, valeurs non finies ou non numériques rabattues sur les défauts 6 × 4. Valeurs numériques positives usuelles inchangées. Aucun changement aux unités, coordonnées, seuils de qualité ou calculs de couverture.

## Défaillance évitée
Avant, `cols: Infinity`, `rows: Infinity` ou `cols: 1e12` pouvaient déclencher `RangeError` à l'allocation d'une grille. Les options booléennes étaient converties implicitement en nombres. Après, la grille est bornée à 16 384 cellules et les options ambiguës sont ignorées.

## Validation
- 9 cas de bornage : 0 échec après correction, 3 exceptions avant.
- 5 suites de régression existantes sur la heatmap répétées 5 fois : 25 exécutions réussies dans un environnement JS isolé (assertions synthétiques).
- Compilation JS du module et de la dépendance motion : réussie.
- Micro-benchmark indicatif (1 500 appels sur une petite grille) : 78 ms avant / 88 ms après ; fluctuation possible, pas un gain de performance démontré.
- À confirmer : CI Node, navigateur et vidéos réelles du C.A. Yenne.

## Limites de confiance
Ce correctif empêche les configurations de grille extrêmes de faire échouer l'affichage. Il ne rend **aucune** métrique fiable sans calibration, identité et couverture défendables ; `INDISPONIBLE` reste obligatoire lorsque la preuve manque. Aucun changement au logo officiel ni à l'interface.
