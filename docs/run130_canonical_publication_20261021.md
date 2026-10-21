# RUN130 — publication canonique unique (21 octobre 2026)

## Provenance et licences
- Code adapté : modules internes CAY-STABLE `first_results_runtime_guard_bridge_v1.js` et `player_card_renderer_v1.js` sur RUN123 (blobs `20c0a9f408abdd4abcfbadb22d1bf08e81b28f86` et `359b862653fcdeb47b8b45b08d0c85d912396ebd`).
- Origine du correctif : patch local RUN129, complété par la protection RUN130 des deux ordres de chargement.
- Aucun code, modèle, poids, dataset ou bibliothèque tiers importé ; aucune nouvelle licence ni dépendance.
- Interface officielle, logo et thème rouge/noir inchangés.

## Comportement
Le garde de couverture et tracking est propriétaire du rendu final. Si le renderer charge après le garde, il ne crée plus de second wrapper `report()`. Si le renderer charge avant, il attend la preuve `runtimeTrackingGuard` **et** `observationCoverageGuard` ; le garde publie ensuite les fiches filtrées.
Sans couverture vérifiée : visuels et métriques INDISPONIBLE. Couverture partielle : visuels défendables uniquement. Couverture FIABLE et runtime vérifié : publication autorisée.

## Validation
3 campagnes V8 sur sources GitHub exactes, 24 assertions, syntaxe des deux modules vérifiée ; tests Python de l'installateur local : 4/4 sur 3 campagnes. Régression reproduite : 2 rendus en ordre garde→renderer avant, 1 après. CI complète et vidéo réelle à confirmer avant fusion.

## Contrôle supplémentaire : rendu direct STABLE
Le point d'entrée `renderPlayerStats(report)` de `stable_runtime_tracking_v2.js` est désormais bloqué sans verdict de tracking actif **et** couverture visuelle explicitement autorisée. Il efface les anciennes informations de couverture et affiche `INDISPONIBLE` plutôt qu'une fiche ou une métrique non prouvée. Tests synthétiques : 15 vérifications V8 (3 campagnes) ; appel du renderer sans garde : 1 avant / 0 après. L'export et la fin de tracking doivent être qualifiés séparément.
