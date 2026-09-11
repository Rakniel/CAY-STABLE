# Roboflow Trackers — OC-SORT comme candidat caméra mobile (2026-09-11)

## Source et provenance

- Projet : `roboflow/trackers`
- Documentation consultée : https://trackers.roboflow.com/latest/
- Licence vérifiée : Apache-2.0 (`https://github.com/roboflow/trackers/blob/develop/LICENSE`)
- État observé le 2026-09-11 : la documentation publique annonce ByteTrack, SORT et OC-SORT, avec évaluation MOT17/SportsMOT et métriques HOTA/IDF1/MOTA.
- Code copié dans CAY-STABLE : **aucun**.

## Découverte utile pour CAY-STABLE

La documentation amont recommande ByteTrack comme point de départ généraliste, mais indique OC-SORT lorsque le mouvement caméra est significatif ou que les trajectoires sont non linéaires. Ce critère correspond mieux que le seul IoU/mouvement constant à certaines séquences C.A. Yenne filmées avec panoramiques et recadrages.

Cette découverte ne remplace pas le tracker CAY actuel. Elle ajoute **OC-SORT comme candidat explicite de benchmark**, à comparer dans le même protocole que ByteTrack/BoT-SORT sur vidéos C.A. Yenne avec :

- HOTA / IDF1 si vérité terrain disponible ;
- fragmentation d'identité et changements d'ID ;
- récupération après occultation ;
- faux rattachements banc/spectateurs ;
- stabilité pendant panoramique caméra ;
- coût CPU/latence ;
- impact sur la continuité des trajectoires et la couverture métrique défendable.

## Comparaison avec les pistes déjà étudiées

- **ByteTrack** : candidat mature, simple et rapide ; reste le baseline prioritaire.
- **BoT-SORT** : pertinent pour CMC/ReID, mais les fonctions ReID amont observées en août 2026 sont encore associées à des travaux récents ; ne pas promouvoir sans benchmark reproductible CAY.
- **OC-SORT** : nouveau candidat prioritaire pour le cas caméra mobile parce que cette utilisation est explicitement recommandée par la documentation actuelle de Roboflow Trackers.

## Décision

**Statut : étudié / benchmark à préparer, non intégré.**

Aucune dépendance ni aucun code externe n'est ajouté par cette note. Une promotion future devra passer par les portes de benchmark/licence déjà présentes dans CAY-STABLE et démontrer un gain mesurable sur vidéo C.A. Yenne. Si le candidat ne dépasse pas l'existant, il sera rejeté sans ajouter de logique parallèle.

## Gain de travail attendu

Le projet fournit déjà une implémentation et une chaîne d'évaluation standardisées, ce qui peut éviter de réécrire un tracker ou un harness MOT complet. Le gain potentiel est de l'ordre de plusieurs jours de développement exploratoire ; le gain réel reste à mesurer après branchement dans le protocole CAY.
