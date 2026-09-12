# TeamTrack — benchmark MOT et trajectoires terrain (audit 2026-09-12)

## Provenance

- Projet : `AtomScott/TeamTrack`
- Source : https://github.com/AtomScott/TeamTrack
- Révision auditée : `748a77db7d631818b9736d3af456e65346c466e5` (dernier commit visible lors de l'audit du 2026-09-12)
- Licence du code du dépôt : MIT (fichier `LICENSE` / page GitHub du dépôt)
- Licence des vidéos/annotations : **ne pas déduire MIT de la seule licence du dépôt**. Le README public décrit les liens Google Drive/Kaggle et les formats mais n'affiche pas, dans la section auditée, une licence de données séparée suffisamment explicite pour autoriser une redistribution par CAY-STABLE.
- Usage CAY-STABLE : référence de benchmark et inspiration de contrat uniquement ; aucun code, modèle, vidéo ou annotation TeamTrack n'est copié ou redistribué dans le runtime.

## Fonction utile pour CAY-STABLE

TeamTrack fournit un jeu de données multi-sport full-pitch comprenant du football, avec plus de 4 millions de bounding boxes annotées et des identités persistantes. Le projet publie notamment :

1. un export `teamtrack-mot` au format MOT Challenge, compatible avec TrackEval ;
2. un export `teamtrack-trajectory` projeté en coordonnées terrain, limité aux sports/séquences à caméra latérale fixe indiqués par le projet.

CAY-STABLE possède déjà `motchallenge_tracking_artifact_adapter_v1.js`, `tracking_trackeval_export_v1.js`, `tracking_trackeval_bundle_v1.js` et ses gardes de promotion. Aucun nouveau format propriétaire n'est nécessaire pour le benchmark MOT.

Cette passe ajoute `tracking_metric_trajectory_promotion_gate_v1.js`, un contrat CAY clean-room qui empêche qu'un tracker gagnant en HOTA/IDF1 soit promu s'il dégrade les trajectoires métriques. Le garde ne lit ni ne copie de code TeamTrack : il consomme uniquement des rapports CAY pré-calculés contenant le nombre de points GT, les points comparables, RMSE en mètres, erreur P95, couverture métrique, faux points hors terrain, le jeu de séquences et une empreinte de vérité terrain.

## Ce que cela évite

- pas de nouvel adaptateur de vérité terrain TeamTrack à écrire pour le benchmark MOT ;
- pas de protocole HOTA/IDF1 maison à inventer ;
- pas de promotion d'un tracker sur la seule qualité image-plane lorsque ses trajectoires terrain régressent ;
- même jeu de séquences et même empreinte GT exigés avant comparaison, donc moins de comparaisons artificiellement favorables.

Gain de travail estimé : environ **0,5 à 1,5 journée** de préparation/conception de benchmark, hors téléchargement et exécution des données.

## Impact attendu et mesurable

Le nouveau garde compose deux preuves indépendantes :

- preuve MOT CAY existante : HOTA, IDF1, MOTA, ID switches, faux CAY et banc/spectateurs ;
- preuve trajectoire métrique : RMSE mètres, P95 mètres, couverture métrique et faux points hors terrain.

Par défaut, une promotion complète refuse toute régression de RMSE, P95, couverture, faux points hors terrain, faux CAY, banc/spectateurs ou identité. Les seuils restent configurables mais aucune amélioration de précision réelle n'est revendiquée avant benchmark sur données externes autorisées puis sur vraies vidéos C.A. Yenne.

## Frontière de licence et risques

- code TeamTrack : MIT ; conserver la notice si du code devait être importé ultérieurement ;
- vidéos/annotations TeamTrack : **aucune redistribution, incorporation au dépôt ou CI tant qu'une licence/autorisation de données explicite n'a pas été vérifiée séparément** ;
- cette passe n'embarque donc ni données, ni vidéos, ni annotations, ni code TeamTrack ;
- domaine : les vues full-pitch 4K/8K et caméras fixes ne représentent pas automatiquement les captations C.A. Yenne ; une victoire externe ne suffit jamais à promouvoir un backend ;
- les gardes CAY spécifiques restent obligatoires : faux CAY jaunes, banc/spectateurs, 11 joueurs simultanés, validité terrain/calibration, couverture et publication fail-closed.

## Modifications CAY-STABLE dérivées de l'étude

- `tracking_metric_trajectory_promotion_gate_v1.js` : nouveau contrat clean-room, aucun code externe copié ;
- `tests/tracking_metric_trajectory_promotion_gate_nonregression.js` : non-régressions sur RMSE/P95/couverture/hors-terrain, mismatch GT/séquences et composition avec le garde MOT existant ;
- aucune dépendance runtime supplémentaire.

## Statut

**Idée adaptée / garde intégré. Code TeamTrack non intégré. Données TeamTrack non intégrées et juridiquement séparées jusqu'à vérification explicite de leur licence propre.**
