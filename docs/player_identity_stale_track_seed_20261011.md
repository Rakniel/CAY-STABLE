# CAY-STABLE — exclusion des associations de tracks obsolètes (2026-10-11)

Origine : logique interne `player_identity_binding_session_v1.js`, aucune bibliothèque externe ajoutée.

Défaut reproduit : un track obsolète 777 pouvait réserver le joueur lié au track 7, produire une association fantôme et annoncer une analyse complète à tort.

Correction : filtrer les associations initiales sur les tracks présents **avant** `Binding.buildIndex`, en réutilisant `Binding.normalizeTrackId`. Validation humaine inchangée. Test : `node tests/player_identity_stale_track_seed_nonregression.js`.

Validation locale V8 : 50 répétitions, 300 assertions, 2 contrôles de syntaxe. La CI complète et les tests navigateur restent requis avant promotion.

Limite : le stockage global des liens entre vidéos reste à isoler dans `club_roster_identity_ui_v1.js` ; cette correction ne suffit pas à garantir l'isolation entre analyses.

Licence : code CAY existant, aucune dépendance ni code externe copié.
