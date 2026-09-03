# OSS audit — calibration terrain V2 + récupération joueurs (2026-09-03)

## Problème CAY observé

Le calibrage historique de `CAY_ANALYZER_STABLE.html` demandait encore un polygone libre / une série de points de correction, alors que la calibration football correcte doit reposer sur des **repères sémantiques du terrain** (intersections, lignes, cercle central, surfaces) associés à leur géométrie connue. Sur les vidéos C.A. Yenne, ce flux produisait des formes sans sens géométrique et pouvait imposer beaucoup de clics sans fournir une homographie défendable.

En parallèle, COCO-SSD peut rater des joueurs lointains ou petits. La couleur du maillot ne doit jamais, à elle seule, prouver qu'une personne existe ni qu'elle appartient au C.A. Yenne.

## Sources étudiées

### 1. roboflow/sports
- Révision auditée : `42c80c06b6b65a7f89455b89fe31cdf4c38ba227`
- Licence : MIT
- Élément étudié : `sports/configs/soccer.py`, topologie de 32 repères de terrain et workflow keypoints -> homographie.
- Réutilisation CAY : **idée / topologie adaptée clean-room** dans `pitch_semantic_calibration_v2.js`.
- Modification CAY : coordonnées recalculées sur le modèle CAY 105 x 68 m et les dimensions football déjà présentes dans `pitch_geometry_guard_v1.js`; aucun modèle YOLO/Ultralytics n'est importé.
- Gain estimé : 1 à 2 jours de conception évités pour définir un registre stable de repères et son contrat de correspondance.
- Statut : **INTÉGRÉ (code MIT conceptuel, sans modèle AGPL)**.
- Risque : les poids YOLOv8 pose couramment associés au tutoriel Roboflow sont AGPL-3.0 et ne sont donc pas intégrés au runtime CAY.

### 2. rafaelsouza-tech/soccer-tactical-vision
- Révision auditée : `4c557534c624948f3bfe3db956859c7ea3b442fa`
- Licence : MIT
- Éléments étudiés :
  - calibration `keypoints -> RANSAC homography -> validation -> smoothing`;
  - `calib/lines.py` : les annotations sémantiques de lignes sont une vraie contrainte de calibration, pas une frontière de pelouse;
  - `team/color.py` : indices Lab/HSV avec masquage du gazon comme **caractéristique d'apparence**, séparée de l'existence d'une personne et de son identité.
- Réutilisation CAY :
  - `pitch_semantic_calibration_v2.js` fournit les correspondances sémantiques au moteur `automatic_pitch_calibration_v1.js` déjà présent;
  - `player_candidate_recovery_v1.js` utilise uniquement l'idée "apparence non-gazon + forme + support gazon" pour proposer un **candidat personne générique**, jamais pour prouver CAY.
- Code tiers copié : non.
- Dépendance ajoutée : aucune.
- Gain estimé : 1 à 2 jours de plomberie / séparation des responsabilités évités.
- Statut : **INTÉGRÉ (adaptation clean-room)**.
- Risque : le détecteur de keypoints RF-DETR du projet n'est pas livré comme poids navigateur dans CAY; le contrat V2 est prêt pour une source de keypoints compatible.

### 3. MM4SPA/tvcalib
- Licence : MIT.
- Fonction : segmentation sémantique des lignes + calibration caméra sportive.
- Point fort : vrai système de registration football, bien plus proche du besoin CAY que le polygone libre historique.
- Limite pour CAY-STABLE actuel : pipeline Python/PyTorch + poids de segmentation; non exécutable directement dans le HTML statique sans backend ou export de modèle contrôlé.
- Statut : **ÉTUDIÉ — candidat backend / benchmark**, pas copié dans le navigateur.
- Gain potentiel : plusieurs jours à plusieurs semaines si CAY bascule vers un backend vision local/serveur.

### 4. Spiideo/soccersegcal
- Licence : MIT.
- Fonction : segmentation des marquages de terrain puis optimisation de caméra, contribution SoccerNet Calibration 2023.
- Limite : dépendances Python/PyTorch3D lourdes pour le navigateur.
- Statut : **ÉTUDIÉ — benchmark/calibration backend**, non intégré au runtime HTML.

### 5. mguti97/PnLCalib
- Licence : GPL-2.0.
- Fonction : keypoints + lignes + optimisation de calibration.
- Statut : **REJETÉ POUR RÉUTILISATION DE CODE RUNTIME** selon la politique de licence CAY actuelle. Les idées scientifiques peuvent être comparées, aucun code n'est copié.

### 6. julianzu9612/RFDETR-Soccernet
- Version modèle : 1.0.0, RF-DETR-Large, 4 classes (`ball`, `player`, `referee`, `goalkeeper`).
- Licence déclarée : Apache-2.0.
- Performance déclarée par le model card : mAP@50 85.7 % sur SoccerNet-Tracking.
- Taille annoncée : ~1.46 Go, résolution 1280, 128 M paramètres.
- Statut : **ÉTUDIÉ / BENCHMARK_ONLY** dans CAY. Le registre `detector_candidate_registry_v1.js` exige toujours provenance exacte des poids + benchmark sur vraies vidéos C.A. Yenne avant promotion.
- Risque : modèle trop lourd pour un chargement navigateur transparent; candidat plus naturel pour un backend local/GPU.

## Décision d'architecture

1. **Le polygone libre de pelouse n'est plus une calibration.**
2. La calibration V2 accepte uniquement des **repères sémantiques de terrain** et les transmet au moteur d'homographie validé existant.
3. Minimum V2 : 6 repères visibles suffisamment répartis; sinon les métriques terrain restent `INDISPONIBLE`.
4. Les coordonnées image/trajectoires peuvent continuer sans calibration métrique.
5. La récupération d'un joueur manqué peut produire un candidat `UNKNOWN`, mais ne peut jamais produire automatiquement un joueur `CAY`.
6. La prochaine promotion d'un détecteur joueur/keypoints appris doit passer par le benchmark vidéo C.A. Yenne et le garde de licence existant.

## Mesures de non-régression ajoutées

- `tests/pitch_semantic_calibration_v2_nonregression.js`
  - 32 repères canoniques;
  - calibration synthétique défendable acceptée;
  - moins de 6 repères -> `INSUFFICIENT_EVIDENCE`;
  - aucune utilisation de polygone libre.
- `tests/player_candidate_recovery_nonregression.js`
  - joueur jaune lointain synthétique récupéré;
  - joueur rouge récupéré;
  - ligne blanche horizontale non transformée en joueur;
  - petit détail jaune non transformé en joueur;
  - aucune identité d'équipe créée;
  - déduplication avec une détection personne existante.
