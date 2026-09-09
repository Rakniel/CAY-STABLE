# TrackEval CLEAR fragmentation -> garde de promotion tracking CAY

Date d'audit : 2026-09-09

## Source et provenance

- Projet : `JonathonLuiten/TrackEval`
- Dépôt : https://github.com/JonathonLuiten/TrackEval
- Révision de référence vérifiée : `12c8791b303e0a0b50f753af204249e622d0281a`
- Licence : MIT
- Zone étudiée : famille de métriques CLEAR MOT, notamment `IDSW` et `Frag`.

## Idée adaptée

TrackEval/CLEAR traite la fragmentation (`Frag`) comme un signal distinct des changements d'identité (`IDSW`). Une trajectoire peut réduire ses ID switches tout en devenant plus souvent perdue puis retrouvée ; regarder uniquement IDSW peut donc masquer une régression de continuité.

CAY disposait déjà, depuis le benchmark `tracking_identity_benchmark_v1`, de `fragments` et `labelledCoverage`. L'adaptation consiste uniquement à raccorder ces preuves au précheck de promotion déjà existant dans `tracking_candidate_promotion_gate_v1` :

- `fragments` est désormais requis pour le précheck annoté ;
- une hausse de fragmentation au-delà de `maxFragmentIncrease` (0 par défaut) bloque la promotion ;
- `labelledCoverage` est utilisée en priorité sur la couverture brute lorsqu'elle est disponible ;
- les critères HOTA/IDF1/MOTA, zéro faux CAY, banc/spectateurs et réduction stricte des ID switches restent inchangés.

## Réutilisation et modifications

- Code TrackEval copié : **aucun**.
- Algorithme TrackEval copié : **aucun**.
- Dépendance runtime ajoutée : **aucune**.
- Poids/données externes : **aucun**.
- Modification CAY : extension du garde interne existant et de sa non-régression ; pas de second moteur de promotion.

## Gain et impact

Travail évité estimé : ~0,25 journée de conception d'une métrique de continuité séparée, puisque le benchmark CAY produisait déjà la fragmentation.

Impact mesurable de la fixture : un candidat qui passe de 6 à 3 ID switches mais de 4 à 5 fragmentations était auparavant admissible au précheck annoté ; il est désormais rejeté avec `IDENTITY_FRAGMENTATION_REGRESSION`.

## Statut / risques

Statut : **intégré dans le garde de promotion, sous validation CI**.

Risques :
- la fragmentation reste dépendante de la qualité et de la densité des annotations C.A. Yenne ;
- les frontières de plans doivent rester déclarées pour ne pas compter une coupe caméra comme fragmentation ; ce comportement est déjà assuré par le benchmark d'identité CAY ;
- ce précheck ne remplace pas HOTA/IDF1/MOTA ni TrackEval complet pour une promotion finale.
