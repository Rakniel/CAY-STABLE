# SoccerNet `sn-trackeval` — benchmark tracking CAY-STABLE (2026-09-11)

## Provenance

- Projet : `SoccerNet/sn-trackeval`
- Source : https://github.com/SoccerNet/sn-trackeval
- Branche observée : `main`
- Nature : fork de TrackEval adapté aux tâches SoccerNet MOT / Game State Reconstruction.
- Licence vérifiée : **MIT** (`LICENSE`, copyright Jonathon Luiten, 2020).
- Code copié dans CAY-STABLE : **aucun**.
- Dépendance runtime ajoutée : **aucune**.

## Fonction utile

Le projet fournit une chaîne d'évaluation tracking mature avec notamment HOTA et les métriques de tracking associées, ainsi qu'un support explicite des formats SoccerNet. Pour CAY-STABLE, sa valeur immédiate est l'évaluation comparative des candidats ByteTrack / BoT-SORT / OC-SORT / tracker actuel, pas l'inférence en production.

## Ce que cela remplace / évite

Au lieu d'écrire un évaluateur MOT spécifique CAY avant chaque comparaison de tracker, CAY peut normaliser ses exports de benchmark puis utiliser un outil de référence déjà éprouvé. Cela évite de réimplémenter les métriques HOTA et une grande partie du harness d'évaluation.

## Gain attendu

- travail évité : environ 0,5 à 2 jours de conception / validation d'un harness HOTA maison ;
- comparaisons reproductibles entre trackers ;
- meilleure séparation entre qualité de détection et qualité d'association ;
- décision de promotion fondée sur des métriques standard plutôt que sur une impression visuelle.

## Stratégie CAY

`sn-trackeval` doit rester un **outil de benchmark/dev** et ne pas entrer dans le bundle navigateur STABLE. Les futurs exports CAY devront conserver les identités, frames, boîtes et catégories nécessaires au protocole d'évaluation, tout en ajoutant les critères spécifiques C.A. Yenne qui ne sont pas couverts par HOTA :

- faux CAY dus à des détails jaunes ;
- banc / spectateurs ;
- stabilité pendant panoramiques ;
- récupération après occultation ;
- couverture terrain métrique défendable ;
- latence / coût CPU-GPU.

## Statut

**Étudié / retenu comme référence de benchmark, non intégré au runtime.**

Risque principal : HOTA ou IDF1 seuls ne garantissent ni la bonne classification C.A. Yenne, ni la validité de l'homographie, ni la défendabilité des métriques physiques. Ils doivent donc compléter, et non remplacer, les gardes CAY existants.
