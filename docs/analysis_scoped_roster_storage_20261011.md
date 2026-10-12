# CAY-STABLE — stockage des associations isolé par analyse (2026-10-11)

Origine : `club_roster_identity_ui_v1.js` et validateur de session CAY existants. Aucun code tiers, aucune nouvelle licence ou dépendance.

Risque initial : l'ancienne clé globale `CAY_STABLE_TRACK_ROSTER_BINDINGS_V1` réutilisait des IDs techniques entre vidéos et pouvait attribuer le mauvais joueur.

Correction : clé persistée suffixée par un identifiant d'analyse généré à la création du bridge, refus des lectures/écritures sans identifiant, non-migration de l'ancienne clé, remise à zéro de la session lors du changement d'analyse. La validation humaine explicite reste obligatoire.

Tests : `node tests/analysis_scoped_roster_storage_nonregression.js` et `node tests/club_roster_identity_ui_nonregression.js`. CI GitHub et navigateur multi-vidéos indispensables avant promotion STABLE.

Limite : un rechargement produit une nouvelle session et demande une nouvelle confirmation des associations. Un futur contrat de reprise sécurisée devra associer vidéo, analyse et roster sans se fier au seul ID de track.
