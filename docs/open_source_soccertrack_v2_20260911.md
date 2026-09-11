# Open-source audit — SoccerTrack v2

Date d'inspection : 2026-09-11

## Source et version inspectée

- Projet : `AtomScott/SoccerTrack-v2`
- Révision inspectée : `6f5c47cd3a5c38b074c44e9c98dfba48daa230d3` (2026-08-11)
- Objet : dataset et toolkit full-pitch/multi-view pour Game State Reconstruction (GSR), Ball Action Spotting (BAS) et Multi-Object Tracking (MOT).

## Licence

Le projet distingue explicitement :

- code du dépôt : MIT ;
- dataset vidéo + annotations GSR/BAS/MOT : CC BY 4.0.

Ces licences autorisent la réutilisation, y compris commerciale, sous réserve des obligations d'attribution applicables. Les dépendances transitives restent à auditer séparément avant toute importation de code ou de modèle.

## Briques utiles pour CAY-STABLE

1. **Format GSR / identité joueur** : coordonnées terrain par frame, identité joueur fondée sur le numéro de maillot, rôle et équipe. Intéressant comme référence de benchmark pour le tracking individuel persistant et la liaison roster, sans remplacer les gardes C.A. Yenne existants.
2. **Ball Action Spotting** : 12 classes publiées — Pass, Drive, Header, High Pass, Out, Cross, Throw In, Shot, Ball Player Block, Player Successful Tackle, Free Kick, Goal. Cette taxonomie fournit une base concrète pour notre future phase ballon/passes/possession/tirs au lieu d'inventer immédiatement un schéma d'événements propriétaire.
3. **MOT / GS-HOTA** : le dépôt comporte un évaluateur GSR/MOT et sa révision courante corrige explicitement l'exécution GS-HOTA. Cela peut accélérer les futurs benchmarks de tracking/état de jeu en complément de `sn-trackeval` déjà retenu.
4. **Jeu de données multi-view full-pitch** : 10 matchs panoramiques 4K complets annoncés, avec annotations GSR par frame et BAS. Candidat intéressant pour tests hors C.A. Yenne avant promotion d'un composant, sans remplacer les tests vidéo club.

## Décision CAY-STABLE

**Statut : étudié / retenu comme référence de benchmark et de contrat d'événements ; aucun code ni dataset intégré dans cette passe.**

Raisons :

- forte proximité avec notre roadmap (MOT persistant, coordonnées terrain, identité maillot, ballon et événements) ;
- licence du code permissive (MIT) et dataset réutilisable sous attribution (CC BY 4.0) ;
- permet d'éviter de concevoir de zéro une taxonomie BAS et une partie du protocole GSR/MOT ;
- aucune dépendance runtime n'est justifiée tant que le build STABLE tracking/terrain/physique n'est pas validé sur nos propres vidéos.

## Ce que cela remplace / travail évité potentiel

- évite de définir de zéro une première taxonomie d'événements football : estimation **0,5 à 1 jour** de conception et de cas de test ;
- fournit une base de benchmark GSR/MOT exploitable : estimation **1 à 2 jours** de protocole/format d'évaluation évités si retenue après essai ;
- peut servir de référence pour le futur contrat maillot/roster sans modifier aujourd'hui l'identité C.A. Yenne.

## Risques / dépendances

- multi-view/panoramique 4K différent de certaines captations C.A. Yenne : les performances ne sont pas transférables automatiquement ;
- les numéros de maillot visibles dans le dataset ne garantissent pas une reconnaissance fiable sur nos images ;
- les modèles/baselines et leurs dépendances doivent être audités individuellement avant intégration ;
- CC BY 4.0 impose attribution si le dataset/annotations sont redistribués ou réutilisés ;
- aucun résultat SoccerTrack v2 ne doit être présenté comme une performance C.A. Yenne.

## Modification CAY-STABLE dans cette passe

Documentation uniquement. Aucun code, poids, modèle, vidéo ou annotation SoccerTrack v2 n'est copié dans CAY-STABLE.
