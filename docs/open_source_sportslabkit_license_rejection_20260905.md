# SportsLabKit — audit licence et décision CAY-STABLE (2026-09-05)

## Source inspectée

- Projet : `AtomScott/SportsLabKit`
- Révision inspectée : `9591d6db9e8de20e6a458ba24a45ac58d23d1358`
- Version annoncée par cette révision : `0.3.2a10`
- Licence du dépôt à cette révision : GNU GPL v3
- Capacités pertinentes : SORT / DeepSORT / ByteTrack / TeamTrack, modèles de détection et ReID interchangeables, calibration 2D terrain, structures de données pour trajectoires.

## Compatibilité CAY-STABLE

SportsLabKit est techniquement intéressant pour accélérer un pipeline football complet, mais sa licence GPL-3.0 impose un copyleft fort. CAY-STABLE ne doit donc pas copier, incorporer ou dériver directement son code tant qu'une décision explicite d'accepter ces obligations de distribution n'a pas été prise.

Décision actuelle : **REJETÉ POUR INTÉGRATION DE CODE / DÉPENDANCE**.

Cette décision vaut également pour tout copier-coller de ses implémentations SORT, DeepSORT, ByteTrack, TeamTrack, calibration ou wrappers. Aucun code, modèle, poids, dataset ni dépendance SportsLabKit n'est ajouté par cet audit.

## Ce qui reste utilisable légalement

Les concepts généraux et l'observation d'architecture peuvent servir uniquement comme point de comparaison : séparation détection / tracking / ReID, représentation explicite Team ID + Player ID, projection vers coordonnées terrain, sortie trajectoire tabulaire. CAY-STABLE conserve ses implémentations propres ou des briques permissives déjà auditées (MIT/BSD) pour ces fonctions.

## Gain / coût évité

- Gain immédiat d'intégration : **0** (rejet licence).
- Travail évité : risque de réécriture / mise en conformité tardive estimé à **0,5–2 jours** si la dépendance avait été intégrée avant audit.
- Impact produit : aucun changement de runtime ; réduction du risque licence et maintien d'une frontière claire pour les futures briques tracking/calibration.

## Risques et dépendances

- Risque principal : réutiliser par inadvertance une implémentation GPL lors d'une future accélération du tracking.
- Mesure : conserver cette entrée d'audit et exiger une nouvelle revue de licence avant toute réévaluation.
- Dépendance ajoutée : aucune.

## Statut

**REJETÉ (licence incompatible avec la politique d'intégration permissive actuelle).**
