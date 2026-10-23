# CAY-STABLE — audit de réutilisation open source (23 octobre 2026)

**Périmètre** : étude de compatibilité et de réutilisation. Aucun code, poids de modèle ni jeu de données tiers n'est importé par cet audit. Les SHA ci-dessous identifient les versions examinées (commit amont), pas des dépendances déjà intégrées.

| Projet / provenance | Révision examinée | Licence du dépôt vérifiée | Fonction / logique CAY visée | Statut | Risques et conditions |
| --- | --- | --- | --- | --- | --- |
| [Roboflow Trackers](https://github.com/roboflow/trackers) | `54078229c1bf381bcdc41c431ca11097abfec16c` | Apache-2.0 (fichier LICENSE) | ByteTrack, BoT-SORT, compensation caméra; remplacer à terme le suivi multi-objets maison uniquement après mesures comparatives | **ÉTUDIÉ, NON INTÉGRÉ** | Python >=3.10, supervision.Detections; adapter le pont navigateur ↔ calcul, vérifier les licences de chaque détecteur et poids |
| [BoT-SORT](https://github.com/NirAharon/BoT-SORT) | `251985436d6712aaf682aaaf5f71edb4987224bd` | MIT (fichier LICENSE) | Référence pour ReID/GMC, pas de copie du tracker existant sans preuve de gain | **ÉTUDIÉ, NON INTÉGRÉ** | Dépendances et modèles à auditer séparément, projet amont ancien |
| [TrackLab](https://github.com/TrackingLaboratory/tracklab) | `5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2` | MIT (fichier LICENSE) | Banc d'évaluation SoccerNet/SportsMOT et ReID; éviter de réécrire un framework d'évaluation | **ÉTUDIÉ, NON INTÉGRÉ** | Stack Python/recherche lourde, licence des modèles et jeux de données distincte |
| [OpenCV](https://github.com/opencv/opencv) | `3f12ad88abb751701c3f48464652283710d06cdb` | Apache-2.0 (fichier LICENSE de cette révision) | Homographie, calibration multi-plans et compensation de mouvement | **ÉTUDIÉ, NON INTÉGRÉ** | Vérifier compatibilité du build cible (JS/WASM ou service Python) et précision sur terrain réel |
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