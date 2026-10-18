# RUN60 — Composition rapide et profils joueurs (18 octobre 2026)

## Périmètre
Module CAY existant `club_roster_identity_ui_v1.js`, sans nouveau moteur. Réutilise `app_domain_models_v1.js` pour `createPlayer`, `createTeam` et `validateLineup`. Aucun logo modifié.

- Les nouveaux joueurs sont répartis automatiquement : 11 premiers actifs sur le terrain, suivants sur le banc.
- Les compositions historiques restent intactes à la lecture ; préparation des anciens effectifs uniquement sur clic « PRÉPARER LE 11 + BANC ».
- Commandes « 11 », « BANC », « HORS GROUPE » ; refus d'un 12e titulaire, mais effectif global sans limite de 11.
- Persistance des statuts et des champs firstName, lastName, secondaryPosition, isGoalkeeper (auparavant perdus par la normalisation).
- La composition vide reste non prête pour l'analyse ; confirmation manuelle des identités inchangée.

## Qualification
Trois passages ciblés en JavaScript V8 : 140 assertions réussies ; syntaxe du module et du test vérifiée par compilation V8. La suite Node complète et les tests sur navigateur/vidéo doivent encore être confirmés par la CI ; ne pas annoncer le SLA <20 minutes comme mesuré.

## Provenance / licences
Aucun code tiers copié ni dépendance ajoutée. Le contrat de composition et les validations sont ceux du dépôt CAY-STABLE. Les candidats MIT déjà audités (ByteTrack, TrackLab, SoccerTrack v2, Supervision) restent des références d'architecture, non importées dans ce patch. Aucune licence externe nouvelle ni poids de modèle importé.

## Limites
Les postes et profils sont conservés, mais la saisie UI du poste secondaire et du nom séparé reste à construire. Aucun tracking ni métrique physique n'est débloqué par cette modification.