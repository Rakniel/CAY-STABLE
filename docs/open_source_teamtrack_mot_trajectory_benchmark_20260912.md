# TeamTrack — benchmark MOT et trajectoires terrain (audit 2026-09-12)

## Provenance

- Projet : `AtomScott/TeamTrack`
- Source : https://github.com/AtomScott/TeamTrack
- Licence du dépôt : MIT (vérifiée sur la page du dépôt le 2026-09-12)
- Usage CAY-STABLE : référence de benchmark uniquement dans cette passe ; aucun code, modèle, vidéo ou annotation TeamTrack n'est copié dans le runtime.

## Fonction utile pour CAY-STABLE

TeamTrack fournit un jeu de données multi-sport full-pitch comprenant du football, avec plus de 4 millions de bounding boxes annotées et des identités persistantes. Le projet publie notamment :

1. un export `teamtrack-mot` au format MOT Challenge, compatible avec TrackEval ;
2. un export `teamtrack-trajectory` projeté en coordonnées terrain pour des séquences à caméra latérale fixe.

CAY-STABLE possède déjà `motchallenge_tracking_artifact_adapter_v1.js`, `tracking_trackeval_export_v1.js`, `tracking_trackeval_bundle_v1.js` et ses gardes de promotion. La découverte utile est donc qu'aucun nouveau format propriétaire n'est nécessaire pour commencer un benchmark externe : la voie MOT Challenge existante peut être réutilisée.

## Ce que cela évite

- pas de nouvel adaptateur de vérité terrain TeamTrack à écrire pour le benchmark MOT ;
- pas de protocole HOTA/IDF1 maison à inventer ;
- possibilité future de confronter les trajectoires métriques CAY à une référence terrain publique sur le sous-ensemble compatible.

Gain de travail estimé : environ 0,5 à 1,5 journée de préparation de benchmark, hors téléchargement et exécution des données.

## Impact attendu

- comparaison reproductible du tracker actuel, ByteTrack/BoT-SORT et variantes ReID via les exports MOT déjà présents ;
- mesure plus objective des ID switches / continuité / association avant promotion d'un backend ;
- base externe complémentaire aux tests synthétiques CAY.

Aucun gain de précision n'est revendiqué avant exécution sur TeamTrack et sur de vraies vidéos C.A. Yenne.

## Frontière de licence et risques

- dépôt TeamTrack : MIT ; conserver les notices si du code devait être importé ultérieurement ;
- données/vidéos : vérifier séparément les conditions de distribution/téléchargement avant toute redistribution ; cette passe ne les embarque pas ;
- domaine : les vues full-pitch 4K/8K et certaines caméras fixes ne représentent pas nécessairement les captations réelles C.A. Yenne ; une victoire sur TeamTrack ne suffit pas pour promotion en STABLE ;
- les gardes CAY spécifiques restent obligatoires : faux CAY jaunes, banc/spectateurs, 11 joueurs simultanés, validité terrain/calibration, couverture et publication fail-closed.

## Statut

**Étudié / retenu comme benchmark externe compatible avec les adaptateurs MOT déjà présents.** Aucun code TeamTrack intégré au runtime dans cette passe.
