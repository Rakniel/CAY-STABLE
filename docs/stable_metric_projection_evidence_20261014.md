# CAY-STABLE — Preuves de projection métrique (2026-10-14)

## Problème corrigé
Une calibration déclarée valide ne prouve pas que chaque position de joueur est effectivement projetable sur le terrain. L'ancien calcul de couverture instantanée comptait tous les joueurs d'un plan calibré, même pour des points hors terrain ou une projection échouée.

## Adaptation interne
- `player_stats_v1.js` : réutilise `projectedMetricSeries()` pour chaque observation, sans dupliquer de moteur géométrique.
- Les temps, segments et coordonnées métriques sont numériques, finis et non négatifs lorsque nécessaire.
- `metricEligibleCount` conserve le nombre de joueurs effectivement projetés à chaque instant ; la couverture équipe est pondérée par les observations valides.
- La règle >11 joueurs et la détection des doublons restent prioritaires ; aucune troncature silencieuse.
- Les métriques physiques restent INDISPONIBLE sans preuve suffisante.

## Validation
- 8 suites existantes rejouées 5 fois, plus `tests/player_stats_metric_projection_integrity_nonregression.js` rejoué 5 fois.
- Compilation syntaxique du module et du nouveau test dans un environnement JavaScript isolé.
- Scénario de 4 observations dont 1 hors terrain : couverture 100 % avant, 75 % après.
- La CI Node complète, les tests navigateur et la vidéo réelle doivent encore confirmer le résultat.

## Provenance et licences
Ce correctif adapte uniquement le code CAY existant ; **aucun code externe importé**.
Candidat open source étudié séparément : roboflow/sports, révision `42c80c06b6b65a7f89455b89fe31cdf4c38ba227`, licence MIT (fichier LICENSE du dépôt). Idées : détection joueur/ballon et keypoints terrain. Statut : étudié, non intégré. Les poids des modèles, jeux de données et dépendances (notamment les variantes YOLO sous AGPL) exigent un audit indépendant avant tout import.
