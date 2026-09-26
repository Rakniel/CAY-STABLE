# SoccerNet sn-reid — audit ReID multi-vues (2026-09-26)

## Source et version

- Projet : SoccerNet/sn-reid — https://github.com/SoccerNet/sn-reid
- Révision auditée : `621e2b0f2d2a7a3e207b8dd747542b6608bf72db` (2023-07-07).
- Fonction amont : kit/benchmark de ré-identification de joueurs de football entre plusieurs vues caméra, dérivé de Torchreid.
- Licence du code racine : MIT, vérifiée dans `LICENSE` (copyright Kaiyang Zhou, 2018).
- Le dataset SoccerNet, les vidéos, miniatures, annotations, modèles et poids sont des artefacts distincts : la licence MIT du code ne les relicencie pas. Aucun de ces artefacts n'est importé dans CAY-STABLE par cet audit.

## Intérêt concret pour CAY-STABLE

Le dépôt CAY possède déjà une fusion ReID, une galerie d'apparence, des gardes de segment/réentrée, un benchmark d'identité et des gates de promotion. Il serait donc contre-productif de copier le pipeline sn-reid.

La valeur réutilisable est le **protocole de benchmark football multi-vues** :

1. séparer une requête joueur des candidats provenant d'autres vues ;
2. mesurer `mAP` et `rank-1` pour l'apparence/ReID en plus de HOTA/IDF1 du tracker ;
3. tester explicitement les changements de viewpoint plutôt que seulement l'occlusion intra-plan ;
4. conserver l'évaluation ReID indépendante du tracker afin de savoir si un gain vient réellement de l'apparence ;
5. ne jamais transformer une bonne similarité d'apparence en continuité d'identité CAY si le cut/segment n'a pas une preuve de continuité compatible avec les gardes CAY.

Le README amont documente un dataset ReID de 340 993 crops issus de 400 matches et publie, pour le challenge 2023, des résultats de référence en mAP/rank-1 (meilleur tableau publié : 93,26 mAP / 91,26 rank-1). Ces chiffres sont des résultats amont, pas des performances CAY.

## Adaptation retenue

**Statut : étudié / protocole benchmark retenu / aucun code runtime importé.**

Pour le futur bake-off ByteTrack / BoT-SORT / ReID, CAY doit ajouter un volet `reidMultiView` avec au minimum :

- mAP ;
- rank-1 ;
- nombre de requêtes évaluables ;
- nombre de viewpoints distincts ;
- taux de réentrée correctement récupérée ;
- taux de fausse reconnexion entre segments ;
- ventilation CAY / adversaire / arbitre lorsque les annotations le permettent.

Ces métriques sont complémentaires, jamais substitutives, aux veto existants : zéro faux CAY jaune, exclusion banc/spectateurs, maximum 11 CAY simultanés, continuité cross-segment validée, couverture/calibration explicites et publication `INDISPONIBLE` lorsque la preuve manque.

## Ce que cela remplace / travail évité

Cela remplace la conception ad hoc d'un benchmark ReID football par un protocole éprouvé et comparable. Estimation : **2 à 4 jours** de définition de métriques, scénarios multi-vues et critères de lecture évités.

Impact attendu : éviter de promouvoir un embedding/ReID qui améliore seulement quelques réentrées faciles tout en dégradant les changements de vue ou en augmentant les fausses reconnexions.

## Frontière licence et dépendances

- Code sn-reid : MIT compatible en principe, sous conservation des notices si du code était ultérieurement réutilisé.
- Aucun code n'est copié dans cette passe ; seule la méthodologie de benchmark est adaptée.
- Dataset SoccerNet : audit/autorisation séparé obligatoire avant téléchargement ou redistribution dans le projet.
- Poids Torchreid/OSNet ou autres checkpoints : audit séparé obligatoire ; la licence du framework ne suffit pas à autoriser un poids.
- PyTorch/torchvision et autres dépendances : à pinner et auditer seulement si un backend externe est réellement admis.

## Décision

Ne pas intégrer sn-reid comme runtime. Utiliser sa structure d'évaluation multi-vues comme référence pour renforcer le bake-off CAY, tout en gardant les garde-fous CAY plus stricts sur segments, roster, équipe et publication des métriques.