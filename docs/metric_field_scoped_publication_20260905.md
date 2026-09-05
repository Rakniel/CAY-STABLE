# CAY-STABLE — publication physique par champ

Date: 2026-09-05

## Problème inspecté
`metric_publication_guard_v1.js` appliquait un verdict global à toutes les statistiques physiques. Le pic de vitesse possède pourtant une exigence supplémentaire propre — une fenêtre soutenue d'au moins 1 seconde et 2 intervalles continus — qui ne doit pas devenir une dépendance conceptuelle de la distance, de la vitesse moyenne ou du compteur de sprints.

## Modification
- conservation d'un socle commun fail-closed : identité FIABLE, couverture métrique, >= 3 s couvertes, >= 3 s de preuve vitesse continue, score défendable >= 0,80 et qualité FIABLE ;
- distance, vitesse moyenne et sprints utilisent ce socle commun ;
- vitesse maximale utilise le même socle puis exige en plus `sustainedMaxSpeedKmh` ;
- ajout de `publication.fieldStatus` pour rendre l'état de chaque statistique explicite ;
- ajout de `quality.metricMaxSpeed` sans changer les contrats existants `metricDistance`, `metricSpeed`, `sprints` ;
- agrégation équipe de la distance indépendante du nombre de joueurs ayant un pic de vitesse publiable ;
- aucune métrique n'est fabriquée : les diagnostics bruts restent auditables et tout champ insuffisamment prouvé reste `INDISPONIBLE`.

## Ce que cela remplace / travail évité
Cela évite de créer plus tard plusieurs calculateurs ou wrappers de publication par statistique. Le garde existant reste l'unique frontière de publication. Travail de plomberie futur évité estimé : 0,25–0,5 journée.

## Impact attendu
- contrat plus robuste pour l'UI des fiches joueurs : chaque valeur peut afficher son propre statut ;
- préparation directe de l'ordre produit CAY : distance/vitesse/sprints puis ballon/événements, sans couplage artificiel entre champs ;
- aucun seuil assoupli ;
- aucune nouvelle dépendance, aucun poids ou code tiers.

## Validation
Non-régression dédiée : `tests/metric_field_scoped_publication_nonregression.js`, en plus de toute la suite CAY-STABLE.
