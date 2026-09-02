# OSS audit — séparation tracking / calibration (2026-09-02)

## soccer-tactical-vision

- Source: `rafaelsouza-tech/soccer-tactical-vision`
- Version inspectée: commit `4c557534c624948f3bfe3db956859c7ea3b442fa` (2026-08-03)
- Licence du dépôt principal: MIT.
- Architecture utile observée: pipeline séparé `detect/`, `track/`, `calib/`, `project/`, `metrics/`; calibration par keypoints + homographie RANSAC avec validation et lissage temporel; les métriques sont évaluées séparément de la détection/tracking.
- Données/licences signalées upstream: labels SoccerNet utilisés pour évaluation; adaptateur PnLCalib isolé dans `contrib/`; le dépôt indique éviter les dépendances AGPL/GPL dans le runtime principal.
- Réutilisation CAY-STABLE dans cette intégration: **idée architecturale adaptée uniquement**, aucun code copié. Le tracking CAY ne dépend plus du masque de pelouse / de la réussite de calibration; sans polygone manuel explicite, la ROI de tracking devient l'image complète. La publication en mètres reste protégée par les gardes métriques existants.
- Ce que cela remplace: l'ancienne politique `trackingPoly()` qui pouvait prendre `autoField()` / `s.auto` et éliminer tous les joueurs lorsque la segmentation du gazon était fausse.
- Gain estimé: 0,5 à 1 jour de débogage/contournements évités et suppression d'une dépendance circulaire calibration → tracking.
- Impact attendu: une calibration ou segmentation terrain ratée ne doit plus produire artificiellement 0 joueur suivi; la couverture tracking devient mesurable indépendamment de la couverture métrique.
- Statut: **intégré (adaptation d'architecture, sans code tiers)**.
- Risques/dépendances: le plein cadre accepte davantage de candidats hors terrain; les filtres CAY, gardes d'identité, plafond de 11 simultanés et exclusion manuelle doivent donc rester stricts. La prochaine vraie calibration doit reposer sur lignes/keypoints/homographie validée, pas sur la couleur de pelouse.

## VisionPitch-AI

- Source: `ahmedsayed1911/VisionPitch-AI`.
- Licence observée: AGPL-3.0-or-later (le projet documente notamment Ultralytics/YOLO comme cause de cette contrainte).
- Idée utile: conserver des coordonnées image-space quand une calibration est rejetée au lieu de faire semblant d'avoir des coordonnées métriques.
- Statut CAY-STABLE: **idée étudiée seulement**. Aucun code, modèle ou dépendance repris à cause de la licence AGPL incompatible avec la politique de réutilisation permissive retenue pour le runtime CAY.
