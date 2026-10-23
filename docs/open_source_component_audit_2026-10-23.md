# CAY-STABLE — audit de réutilisation open source (23 octobre 2026)

**Périmètre** : étude de compatibilité et de réutilisation. Aucun code, poids de modèle ni jeu de données tiers n'est importé par cet audit. Les SHA ci-dessous identifient les versions examinées (commit amont), pas des dépendances déjà intégrées.

| Projet / provenance | Révision examinée | Licence du dépôt vérifiée | Fonction / logique CAY visée | Statut | Risques et conditions |
| --- | --- | --- | --- | --- | --- |
| [Roboflow Trackers](https://github.com/roboflow/trackers) | `54078229c1bf381bcdc41c431ca11097abfec16c` | Apache-2.0 (fichier LICENSE) | ByteTrack, BoT-SORT, compensation caméra; remplacer à terme le suivi multi-objets maison uniquement après mesures comparatives | **ÉTUDIÉ, NON INTÉGRÉ** | Python >=3.10, supervision.Detections; adapter le pont navigateur ↔ calcul, vérifier les licences de chaque détecteur et poids |
| [BoT-SORT](https://github.com/NirAharon/BoT-SORT) | `251985436d6712aaf682aaaf5f71edb4987224bd` | MIT (fichier LICENSE) | Référence pour ReID/GMC, pas de copie du tracker existant sans preuve de gain | **ÉTUDIÉ, NON INTÉGRÉ** | Dépendances et modèles à auditer séparément, projet amont ancien |
| [TrackLab](https://github.com/TrackingLaboratory/tracklab) | `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2` | MIT (fichier LICENSE) | Banc d'évaluation SoccerNet/SportsMOT et ReID; éviter de réécrire un framework d'évaluation | **ÉTUDIÉ, NON INTÉGRÉ** | Stack Python/recherche lourde, licence des modèles et jeux de données distincte |
| [OpenCV](https://github.com/opencv/opencv) | `3f12ad88abb751701c3f48464652283710d06cdb` | Apache-2.0 (fichier LICENSE de cette révision) | Homographie, calibration multi-plans et compensation de mouvement | **ÉTUDIÉ, NON INTÉGRÉ** | Vérifier compatibilité du build cible (JS/WASM ou service Python) et précision sur terrain réel |
| [Supervision](https://github.com/roboflow/supervision) | `991784b1ff7a5b76a7b41e114b1116bbca5f8328` | MIT (`LICENSE.md`) | Objets `Detections`, annotations, zones et préparation de données ; éviter des adaptateurs/visualisations Python maison | **ÉTUDIÉ, NON INTÉGRÉ** | Python >=3.10 ; les connecteurs optionnels et modèles ont leurs propres licences ; ne remplace pas l'interface JS |
| [Norfair](https://github.com/tryolabs/norfair) | `e517b4236f6b67a6ecf342f5df1fccb7788dbc54` | BSD-3-Clause (`LICENSE`) | Tracker léger indépendant du détecteur, caméra mobile et ReID à évaluer contre le tracking CAY et Trackers | **ÉTUDIÉ, NON INTÉGRÉ** | Python >=3.8 ; état/identité à réinitialiser par vidéo ; dernier commit principal examiné en avril 2025 ; vérifier la maintenance et les licences des détecteurs |
| [RF-DETR](https://github.com/roboflow/rf-detr) | `5b22dfc0940697ce1abdfa681a5f7392b3eddbfb` | Apache-2.0 pour paquet `rfdetr` et modèles désignés Apache ; **composants Plus sous PML 1.0** (README amont) | Candidat de détection joueurs/ballon, à benchmarker sans intégrer de poids non audités | **ÉTUDIÉ, NON INTÉGRÉ** | Python >=3.10, accélération GPU, licences distinctes des poids et variantes Plus ; précision ballon/football non démontrée sur CAY |
| [Ultralytics](https://github.com/ultralytics/ultralytics) | Licence racine contrôlée le 23/10/2026 | **AGPL-3.0** (`LICENSE`) | Référence comparative détecteur/tracker ; aucun code copié | **INTÉGRATION NON AUTORISÉE PAR DÉFAUT** | Obligations AGPL et conditions commerciales à évaluer/approuver explicitement avant tout usage distribué ou en service |
| [BoxMOT](https://github.com/mikel-brostrom/boxmot) | Licence racine contrôlée le 23/10/2026 | **AGPL-3.0** (`LICENSE`) | Référence comparative MOT/ReID, pas de copie du code | **INTÉGRATION NON AUTORISÉE PAR DÉFAUT** | Même réserve AGPL ; ne pas confondre algorithmes décrits publiquement et code sous licence |
| [SoccerNet Tracking kit](https://github.com/SoccerNet/sn-tracking) | `b0bbba35e07ff58010b6313ef8aa59ef663ad392` | **Aucun fichier LICENSE, LICENSE.md ou LICENSE.txt trouvé** dans la racine; README sans licence explicite | Évaluation/données de référence, pas de copie de code | **RÉUTILISATION DU CODE REJETÉE** jusqu'à autorisation/licence explicite | Droits du code, des annotations et des vidéos à clarifier indépendamment |

## Règles d'intégration

1. Ne pas confondre licence du dépôt, licences des dépendances, poids des modèles et droits des vidéos/données.
2. Conserver avis de copyright et texte des licences MIT/Apache-2.0 lorsque du code est effectivement redistribué; conserver un registre des fichiers et modifications importés.
3. Évaluer sur les **mêmes vidéos**, avec même détecteur et mêmes paramètres de confiance, en mesurant ID switches, fragmentation des trajectoires, couverture, latence par image, taux de faux CAY, précision terrain et ressources.
4. Les statistiques sans homographie/calibration valide ou couverture suffisante doivent afficher **INDISPONIBLE**. Ne pas attribuer le jaune des détails de tenue au C.A. Yenne. Exclure banc, arbitres et spectateurs du décompte des joueurs.
5. Ne pas activer de détection, de ReID ou d'événements prétendument « fiables » sans tests sur vidéo réelle et critères d'acceptation reproductibles.

## Gains envisagés, non mesurés

- **Trackers (Apache-2.0)** : potentiel de **2–5 jours** de développement évités par rapport à une implémentation maison de ByteTrack/BoT-SORT/GMC; gain réel à mesurer après intégration.
- **TrackLab (MIT)** : potentiel de **1–3 jours** évités pour une infrastructure d'évaluation ReID/tracking; coût d'intégration potentiellement supérieur pour un navigateur sans backend.
- **OpenCV (Apache-2.0)** : potentiel de **1–3 jours** évités sur les primitives géométriques, sans garantie sur la calibration multi-plans en conditions réelles.
- **SoccerNet/sn-tracking** : **0 jour** revendiqué; code non copiable sans licence/autorisation vérifiée.

## Modifications de cette exécution

Aucun composant externe ajouté ou modifié. Correction locale du garde-fou de scan : une erreur de décodage vidéo empêche la réactivation du bouton « Scan » après le bloc `finally`. Test de non-régression étendu au cas `video.error`.

## Critères avant toute fusion

CI syntaxe + intégration + calibration + Chromium réussie; essai navigateur vidéo valide/invalide; résultats explicites lorsque le tracking automatique ou une métrique n'est pas disponible.
## Comparatif complémentaire — 23 octobre 2026 (RUN196)

- **Priorité de prototypage** : comparer Norfair (BSD-3-Clause) et Roboflow Trackers (Apache-2.0) sur les mêmes détections et vidéos, sans dupliquer le tracker navigateur avant un gain prouvé. Mesures : ID switches, fragmentation, faux positifs CAY, vitesse et mémoire.
- **Détection** : RF-DETR est un candidat permissif **uniquement pour les variantes explicitement Apache-2.0**. Les poids, dépendances et éventuelles variantes Plus/PML exigent un audit séparé avant intégration.
- **Visualisation et données** : Supervision (MIT) peut raccourcir un banc d'essai Python (objets de détection, annotations, zones), mais son portage navigateur ne doit pas être entrepris sans justification.
- **Non retenus par défaut** : Ultralytics et BoxMOT sont sous AGPL-3.0 à la révision contrôlée ; aucun code de ces dépôts n'est importé tant que les obligations n'ont pas été acceptées.
- **Estimation non mesurée** : 1–3 jours évités pour un banc d'essai Supervision/Norfair si un pipeline Python est retenu ; coût d'intégration navigateur potentiellement supérieur. Aucun gain de précision revendiqué.
- **Modification locale indépendante des bibliothèques tierces** : la PR #471 refuse les heatmaps dont les cellules contredisent le nombre d'observations ou la durée confirmée de participation. Aucun code externe ni poids importé.
