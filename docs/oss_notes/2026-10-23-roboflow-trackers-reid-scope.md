# Roboflow Trackers — portée exacte du ReID (23 octobre 2026)

- Projet : https://github.com/roboflow/trackers
- Révision examinée : `54078229c1bf381bcdc41c431ca11097abfec16c` (branche develop).
- Licence vérifiée dans LICENSE : Apache-2.0 ; licences des poids, modèles et jeux de données indépendantes.
- Observation du README : les branches d'apparence/ReID des algorithmes de référence ne sont pas fournies par les trackers proposés. Le BoT-SORT de ce dépôt ne doit donc pas être présenté comme un ReID visuel persistant.
- Utilisation envisagée : ByteTrack/BoT-SORT, association multi-objets, compensation caméra, benchmarks SoccerNet/SportsMOT ; cela pourrait remplacer une partie du suivi géométrique maison, **pas** le ReID, les liens au roster ni l'homographie.
- Statut : ÉTUDIÉ, NON INTÉGRÉ. Aucun code externe importé ni modifié.
- Gain potentiel non mesuré : 2 à 5 jours sur le tracking/GMC, **0 jour revendiqué sur le ReID**.
- Risques : Python >=3.10, intégration au navigateur ou service, dépendances et modèles à auditer, benchmarks obligatoires sur les mêmes séquences C.A. Yenne.
- Changement local indépendant dans PR #472 : garde de cohérence des compteurs de frames avant publication de résultats.
