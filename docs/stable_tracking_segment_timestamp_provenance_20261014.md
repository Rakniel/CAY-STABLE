# CAY-STABLE — garde-fous de provenance et d'horodatage (2026-10-14)

Module étendu : `stable_tracking_bridge_v1.js`. Aucun code tiers importé.

- Clé de calibration et `segment` déclaré doivent être des entiers non négatifs explicites et identiques. `null`, booléens, décimaux, négatifs et clés ambiguës refusés.
- Horodatages des frames : type numérique explicite, valeur finie, non négative, validation avant toute mutation de l'état.
- Rejet conservateur : `validated:false`, `project:null` pour une calibration incompatible. Les métriques géométriques associées restent indisponibles.
- Le roster peut dépasser 11 joueurs sur le match ; le maximum simultané demeure 11.

Provenance : fonctions internes CAY-STABLE déjà présentes ; modification ciblée, **aucune dépendance open source ajoutée**.

Validation isolée sur le code de la branche `b719450d78e019b7cc06312fed092c3bc68a5ef9` : avant 45/85 cas invalides acceptés ; après 0/85. Test dédié : PASS 275 strict segment/timestamp assertions; régressions 11 joueurs/normalisation : 15/15. Tests navigateur, vidéo réelle et CI complète encore nécessaires. Ne pas déclarer le build STABLE certifié avant ces étapes.
