# TrackLab → liaison explicite track / joueur C.A. Yenne

## Provenance
- Projet : TrackingLaboratory/tracklab
- Source : https://github.com/TrackingLaboratory/tracklab
- Version inspectée : 1.3.24
- Révision inspectée : `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2`
- Licence : MIT
- Date de l'audit CAY : 2026-09-03

## Idée réutilisée
TrackLab sépare l'état de tracking (détection, identifiant de piste, métadonnées/ReID) des couches métier qui donnent du sens à cet état. CAY-STABLE reprend ce principe de séparation pour empêcher qu'un identifiant technique de track soit confondu avec l'identité réelle d'un joueur du club.

Aucun code TrackLab n'est copié. Aucune dépendance Python/PyTorch TrackLab n'est ajoutée au runtime navigateur CAY-STABLE.

## Adaptation CAY-STABLE
Le module local `player_card_roster_binding_v1.js` ajoute une liaison explicite, validée et un-à-un entre :
- un `trackId` persistant issu du tracking ;
- un `playerId` appartenant au roster C.A. Yenne déjà défini par `app_domain_models_v1.js`.

Une liaison n'est acceptée que si `validated === true`, si sa confiance est suffisante, si le joueur existe dans le roster et si ni le track ni le joueur ne sont déjà revendiqués par une autre liaison. Sans liaison validée, nom, numéro, photo et poste restent volontairement absents : aucune identité n'est déduite depuis le numéro de track, la couleur du maillot ou une ressemblance visuelle.

Les fiches joueurs peuvent ainsi afficher le trombinoscope, le numéro de maillot et les postes lorsqu'une liaison roster est validée, tout en conservant strictement les gardes métriques existants : l'identité roster ne rend jamais distance/vitesse/sprints disponibles à elle seule.

## Ce que cela remplace
Cela remplace le risque d'une plomberie ad hoc où `trackId` ou une heuristique visuelle pourrait être présenté comme identité de joueur. La couche d'identité club devient un contrat explicite réutilisable par les futures vues Équipe, Trombinoscope, Remplacements et Profils.

## Gain estimé
Environ 0,5 à 1 journée de conception/plomberie évitée grâce à la séparation d'état mature observée dans TrackLab, sans importer son stack lourd.

## Impact attendu et mesurable
- 0 identité roster inférée pour un track non lié ;
- rejet déterministe des liaisons non validées, inconnues ou dupliquées ;
- conservation du plafond de 11 joueurs simultanés dans le tracking, tout en permettant un roster supérieur à 11 ;
- affichage cohérent nom / numéro / photo / poste sur la fiche lorsque la liaison est validée ;
- aucune modification de la politique `INDISPONIBLE` des métriques physiques.

## Risques / dépendances
- L'interface de sélection/validation de la liaison track → joueur reste à exposer proprement dans le parcours club ; ce commit pose le contrat et le rendu, pas un faux workflow automatisé.
- `photoUrl` reste une référence de média ; aucun stockage/backend fictif n'est introduit.
- Si TrackLab est un jour utilisé comme backend réel, ses dépendances Python/PyTorch et les licences de chaque modèle devront être auditées séparément.

## Statut
**INTÉGRÉ — idée adaptée, aucun code tiers copié, aucune dépendance runtime externe ajoutée.**
