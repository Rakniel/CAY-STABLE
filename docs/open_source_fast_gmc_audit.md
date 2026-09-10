# Audit open source — DLR-MI/fast_gmc

Date d'audit : 2026-09-10

## Source et provenance
- Projet : `DLR-MI/fast_gmc`
- URL : https://github.com/DLR-MI/fast_gmc
- Révision auditée : `d854d4ae46ebb0b2d0d9563d35a037a084901987`
- Dernier commit de la branche principale observé : 2024-06-12
- Fonction : compensation rapide du mouvement global caméra (GMC) via OpenCV Video Stabilization, exposée à Python par une extension C++/pybind11.
- Modèles de transformation documentés : `affine` et `homography`.

## Licence
- Licence du dépôt : MIT.
- Fichier `LICENSE` présent et explicite.
- La licence MIT autorise l'utilisation, la modification et la redistribution sous conservation de l'avis de copyright et de licence.
- OpenCV reste une dépendance distincte ; sa provenance/version/licence doivent rester documentées séparément si un backend natif fast_gmc est effectivement distribué avec CAY-STABLE.

## Intérêt pour CAY-STABLE
CAY-STABLE possède déjà un contrat `camera_motion_artifact_provider_v1.js` et un projecteur `metric_camera_motion_projector_v1.js`. La bonne frontière de réutilisation n'est donc pas de recopier fast_gmc dans le runtime navigateur : fast_gmc peut devenir un producteur natif/offline optionnel de matrices de compensation caméra, puis publier ses résultats dans le contrat CAY existant.

Cela évite de dupliquer :
- l'estimation affine/homographique de mouvement global ;
- le wrapping OpenCV/C++ ;
- une partie du plumbing de performance pour un futur mode desktop/offline.

## Gain estimé
- Travail évité : environ 1 à 2 jours pour prototyper proprement un producteur GMC natif OpenCV avec bindings Python/C++.
- Impact attendu : meilleure stabilité d'association et de projection lors des pans/zooms/modifications de plan où le consensus de translation navigateur est insuffisant.
- Aucun gain chiffré de précision n'est revendiqué avant benchmark sur des vidéos représentatives du C.A. Yenne.

## Décision
**Statut : ÉTUDIÉ / CANDIDAT BACKEND OPTIONNEL — NON INTÉGRÉ AU RUNTIME STABLE.**

Motifs :
- licence MIT compatible avec la politique actuelle ;
- frontière d'intégration déjà prête côté CAY via le contrat d'artefact caméra ;
- mais le projet est petit, son dernier commit observé date de 2024 et il ajoute une pile native C++/OpenCV/pybind11 non souhaitable dans le navigateur principal ;
- il faut d'abord mesurer son gain face au producteur CAY léger et face à un backend OpenCV direct (ECC / optical flow / videostab) sur les mêmes séquences.

## Conditions avant intégration
1. Backend strictement optionnel/offline : aucune dépendance native obligatoire pour ouvrir CAY-STABLE.
2. Émettre uniquement le contrat `camera_motion_artifact_provider_v1.js` existant ; ne créer aucun deuxième chemin GMC parallèle.
3. Conserver source, révision, licence, paramètres, modèle affine/homographie, confiance/support/inliers/résidu et timestamps dans la provenance de l'artefact.
4. Repasser tous les gardes CAY existants avant d'autoriser une projection en mètres.
5. Benchmark avant/après sur pans, zooms, cuts, spectateurs/banc et changements de plans ; mesurer erreurs de projection, pertes d'ID et fausses continuités.
6. Rejeter automatiquement toute sortie dont la géométrie, le résidu ou la fraîcheur ne respecte pas les seuils CAY.

## Risques / dépendances
- C++/compilation et pybind11 augmentent le coût d'installation.
- Dépendance OpenCV native plus lourde que le runtime navigateur.
- GMC sur arrière-plan texturé peut être perturbée par grandes zones de pelouse, joueurs dominants, cuts ou mouvements non planaires.
- Une homographie caméra plausible n'est pas automatiquement une calibration terrain valide : le garde terrain CAY reste obligatoire.

## Prochaine expérimentation proposée
Comparer sur le même jeu de clips :
1. producteur CAY actuel ;
2. OpenCV ECC/affine direct ;
3. fast_gmc affine ;
4. fast_gmc homography.

Métriques : taux d'artefacts acceptés, résidu reprojection, erreur de position terrain sur ancres connues, nombre de ruptures/ID switches, temps de calcul par frame et taux de séquences renvoyées `INDISPONIBLE`.
