# Reco — frontière AGPL pour CAY-STABLE (2026-09-11)

## Provenance

- Projet : Reco / `reco-project/video-stitcher`
- Source publique : https://reco.cam/ et dépôt GitHub associé
- Domaine utile : projection, stitching multi-caméras, suivi du jeu et pipeline vidéo football local
- Licence annoncée par le projet : **AGPL-3.0** pour le moteur open source
- Code copié dans CAY-STABLE : **aucun**
- Dépendance ajoutée : **aucune**

## Intérêt technique

Reco confirme qu'une chaîne football locale peut regrouper projection, stitching, IA et tracking dans un moteur commun, avec traitement sur le matériel de l'utilisateur. Les idées intéressantes pour CAY-STABLE sont l'architecture modulaire du pipeline caméra et l'utilisation possible de vues panoramiques/stitchées comme entrée plus stable pour le suivi.

## Décision de licence

Le moteur étant annoncé sous AGPL-3.0, CAY-STABLE ne reprend ni ne vendore son code dans le runtime actuel. Une intégration directe imposerait des obligations copyleft réseau/distribution qui ne doivent pas être acceptées implicitement.

CAY-STABLE peut en revanche :

- benchmarker indépendamment l'idée de stitching/panorama ;
- réimplémenter une approche à partir des principes généraux sans copier le code ;
- privilégier pour une intégration runtime des briques permissives (MIT / BSD / Apache-2.0) fournissant les mêmes fonctions ;
- réévaluer Reco uniquement si une décision explicite accepte l'AGPL ou si une autre licence est proposée par l'amont.

## Gain / impact

- gain immédiat : évite une intégration juridiquement incompatible ou ambiguë ;
- travail évité : audit/réécriture après coup d'un composant copyleft déjà embarqué ;
- impact technique attendu : la piste panorama/stitching reste pertinente pour réduire les sorties de champ et les ruptures de tracking, mais aucun gain C.A. Yenne n'est affirmé avant benchmark vidéo réel.

## Statut

**Étudié / rejeté pour intégration de code sous la licence actuelle.** Source d'architecture et de benchmark seulement.
